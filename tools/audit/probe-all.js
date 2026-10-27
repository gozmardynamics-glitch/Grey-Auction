#!/usr/bin/env node
/**
 * Endpoint sweep — walks the whole API with four identities and reports what is
 * actually broken.
 *
 * Why it exists: a route's OpenAPI `security` block reflects `@ApiBearerAuth()`,
 * not the guard that is really attached, so the document cannot tell you whether
 * an endpoint is protected. Only calling it can. This sweep is how the crashed
 * admin dashboard, the unguarded invitation listings and the `@ApiBearerAuth()`
 * mismatch were found.
 *
 * Usage (API must be running):
 *   node tools/audit/probe-all.js
 *   API=http://localhost:3001 BUYER_EMAIL=… BUYER_PASS=… node tools/audit/probe-all.js
 *
 * Credentials come from the environment, falling back to the dev fixtures. It
 * reads `backend/.env` for nothing except the DB-free defaults, so it can run
 * without a database connection.
 *
 * What it does NOT do: it never sends a valid payload to a write endpoint.
 * Writes are probed anonymously with an empty body, which is enough to prove a
 * guard is missing (400/2xx instead of 401) and cannot mutate anything. Every
 * read is probed with anonymous, buyer, seller and admin tokens.
 *
 * Exit code: 0 clean, 1 findings.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const API = (process.env.API || 'http://localhost:3001').replace(/\/+$/, '');
const OUT_DIR = process.env.OUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'grey-audit-'));

const ACCOUNTS = {
  buyer: {
    email: process.env.BUYER_EMAIL || 'phase4.buyer@greyauction.dev',
    password: process.env.BUYER_PASS || process.env.BUYER_PASSWORD || 'Phase4@12345',
  },
  seller: {
    email: process.env.SELLER_EMAIL || 'phase1.seller@greyauction.dev',
    password: process.env.SELLER_PASS || process.env.SELLER_PASSWORD || 'Phase1@12345',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@greyauction.com',
    password: process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

/**
 * Findings that are correct behaviour rather than defects.
 *
 * Kept explicit so the exit code stays meaningful: without this the sweep always
 * fails on routes that are deliberately not describable by OpenAPI security
 * (a public route that gates private rows) and on the signature-verified
 * webhook, and a gate that is always red is a gate nobody reads.
 */
const KNOWN_OK = [
  {
    match: (label) => /^GET \/api\/rooms\/\{[^}]+\}(\/participants)?$/.test(label),
    reason: 'public route; a private room 403s non-members (response depends on the row, not the route)',
  },
  {
    match: (label) => label === 'POST /api/payments/webhook/{provider}',
    reason: 'public by design; the handler verifies the signature and fails closed ({success:false})',
  },
];

/** Mutating routes that must never be probed with a valid token. */
const SKIP = [
  /^DELETE /, // never fire DELETEs at real rows
  /\/backup/, // may run a database dump
  /\/ai\//, // costs money per call
  /\/auth\/(forgot-password|send-otp|register|reset-password|oauth)/, // sends email / creates users
  /\/contact$/, // creates a ticket
  /^POST \/api\/subscriptions/, // sends an opt-in email
  /\/invites\/(respond|use|request-access|approve|reject|deactivate)/,
  /\/metrics/, // scrape endpoint, noisy
];

async function call(routePath, { method = 'GET', token, body } = {}) {
  const started = Date.now();
  try {
    const res = await fetch(API + routePath, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25000),
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, json, ms: Date.now() - started };
  } catch (err) {
    return { status: 0, error: String(err.message || err), ms: Date.now() - started };
  }
}

async function login(email, password, attempt = 1) {
  const res = await call('/api/auth/login', { method: 'POST', body: { email, password } });
  if (res.status === 200) return res.json.data.token;
  // /api/auth/login is throttled (5/min per IP). Back-to-back sweeps trip it, so
  // wait it out rather than reporting a false failure.
  if (res.status === 429 && attempt <= 2) {
    console.log(`login throttled for ${email} — waiting 45s (attempt ${attempt})`);
    await new Promise((resolve) => setTimeout(resolve, 45000));
    return login(email, password, attempt + 1);
  }
  throw new Error(`login failed for ${email}: HTTP ${res.status}`);
}

/** First row of whatever envelope shape an endpoint uses. */
function rows(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return [];
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (json.data && typeof json.data === 'object') {
    if (Array.isArray(json.data.items)) return json.data.items;
    if (Array.isArray(json.data.data)) return json.data.data;
  }
  return [];
}

const message = (json) => {
  if (!json || typeof json !== 'object') return typeof json === 'string' ? json.slice(0, 120) : '';
  const raw = json.message ?? json.error;
  return (Array.isArray(raw) ? raw.join('; ') : String(raw ?? '')).slice(0, 140);
};

/** Real ids for path parameters, gathered from endpoints that list them. */
async function harvest(tokens) {
  const ids = {};
  const products = rows((await call('/api/products?limit=5')).json);
  ids.productId = ids.auctionId = products[0]?.id;
  const categories = rows((await call('/api/categories')).json);
  // No fallback guess: an empty categories table means the route has no fixture,
  // and inventing 'cars' would report the 404 as a broken endpoint.
  ids.category = categories[0]?.slug || categories[0]?.name;
  const invoices = rows((await call('/api/invoices?limit=5', { token: tokens.admin })).json);
  ids.invoiceId = invoices[0]?.id;
  const sellers = rows((await call('/api/admin/sellers?limit=5', { token: tokens.admin })).json);
  ids.sellerId = sellers[0]?.id;
  const buyers = rows((await call('/api/admin/buyers', { token: tokens.admin })).json);
  ids.userId = buyers[0]?.id || sellers[0]?.user_id;
  const rooms = rows((await call('/api/rooms/mine', { token: tokens.seller })).json);
  ids.roomId = rooms[0]?.id;
  const conversations = rows((await call('/api/conversations', { token: tokens.buyer })).json);
  ids.conversationId = conversations[0]?.id;
  const advisors = rows((await call('/api/advisors')).json);
  ids.advisorId = advisors[0]?.id;
  // Context-specific keys only, and only when a real row was harvested. A bare
  // `ids.id` fallback filled `{id}` with whatever entity happened to be
  // harvested first — turning correct 403/404 answers into phantom findings —
  // and borrowing another entity's slug reported an empty categories table as a
  // broken endpoint. A missing fixture must leave the route "not probed".
  const context = (key, value) => {
    if (value != null) ids[key] = value;
  };
  context('products/id', ids.productId);
  context('invoices/id', ids.invoiceId);
  context('sellers/id', ids.sellerId);
  context('rooms/id', ids.roomId);
  context('conversations/id', ids.conversationId);
  context('categories/slug', ids.category);
  context('advisors/id', ids.advisorId);

  ids.provider = 'paystack';
  ids.code = 'NGN';
  ids.scope = 'seller';
  ids.scopeId = ids.sellerId;
  ids.entityType = 'product';
  ids.entityId = ids.productId;
  ids.mid = 'gpt-4o-mini';
  ids.section = 'general';
  ids.metricId = 'x';
  return ids;
}

/**
 * Fill path parameters. The controller matters: `{id}` under /products is a
 * product, under /invoices an invoice. Guessing one id for all of them produces
 * a screen of false 404s.
 */
const NO_FIXTURE = '__no_fixture__';

function fill(routePath, ids) {
  const firstSegment = routePath.split('/').filter(Boolean)[1] || '';
  let missing = null;
  const target = routePath.replace(/\{(\w+)\}/g, (_, name) => {
    const contextKey = `${firstSegment}/${name}`;
    const value = ids[contextKey] ?? ids[name];
    if (value == null) {
      missing = name;
      return NO_FIXTURE;
    }
    return encodeURIComponent(String(value));
  });
  return { target, missing };
}

async function main() {
  console.log(`sweeping ${API}`);

  const specRes = await call('/api/docs-json');
  if (specRes.status !== 200 || !specRes.json?.paths) {
    console.error(
      'Could not read /api/docs-json. It is served in non-production only — ' +
        'point API at a staging or dev instance and check NODE_ENV.',
    );
    process.exit(2);
  }
  const routes = [];
  for (const [routePath, methods] of Object.entries(specRes.json.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (method === 'parameters') continue;
      routes.push({
        method: method.toUpperCase(),
        path: routePath,
        secured: Array.isArray(op.security) && op.security.length > 0,
        summary: op.summary || '',
      });
    }
  }
  routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  console.log(`inventoried ${routes.length} operations`);

  const tokens = { anon: null };
  for (const [role, account] of Object.entries(ACCOUNTS)) {
    tokens[role] = await login(account.email, account.password);
  }
  console.log('logged in as buyer, seller, admin');

  const ids = await harvest(tokens);

  const results = [];
  const unprobed = [];
  for (const route of routes) {
    const label = `${route.method} ${route.path}`;
    if (SKIP.some((re) => re.test(label))) {
      results.push({ ...route, skipped: true, probes: {} });
      continue;
    }
    const { target, missing } = fill(route.path, ids);
    if (missing) {
      unprobed.push({ route: label, reason: `no fixture for {${missing}} in this environment` });
      results.push({ ...route, skipped: true, probes: {} });
      continue;
    }
    const probes = {};
    // Reads with every identity; writes anonymously only, so nothing mutates.
    const identities = route.method === 'GET' ? ['anon', 'buyer', 'seller', 'admin'] : ['anon'];
    for (const who of identities) {
      const res = await call(target, {
        method: route.method,
        token: tokens[who],
        body: route.method === 'GET' ? undefined : {},
      });
      probes[who] = { status: res.status, message: message(res.json), ms: res.ms, error: res.error };
    }
    results.push({ ...route, target, probes });
  }

  const reportFile = path.join(OUT_DIR, 'probe-results.json');
  fs.writeFileSync(reportFile, JSON.stringify({ api: API, generatedAt: new Date().toISOString(), results }, null, 1));

  const anyStatus = (r, code) => Object.values(r.probes).some((p) => p.status === code);
  const findings = [
    ['CRASHES (500)', results.filter((r) => !r.skipped && anyStatus(r, 500))],
    ['UNREACHABLE / TIMEOUT', results.filter((r) => !r.skipped && anyStatus(r, 0))],
    [
      'AUTH BYPASS (a secured route answered without a token)',
      results.filter(
        (r) => !r.skipped && r.secured && r.probes.anon && ![401, 403].includes(r.probes.anon.status),
      ),
    ],
    [
      'GUARD MISMATCH (documented public, refused anonymously)',
      results.filter(
        (r) => !r.skipped && !r.secured && r.probes.anon && [401, 403].includes(r.probes.anon.status),
      ),
    ],
    [
      'VALIDATION GAP (a write accepted an empty body anonymously)',
      results.filter(
        (r) =>
          !r.skipped &&
          r.method !== 'GET' &&
          r.probes.anon &&
          r.probes.anon.status >= 200 &&
          r.probes.anon.status < 300,
      ),
    ],
    [
      'MISSING FOR AN ADMIN (404 with an admin token)',
      results.filter((r) => !r.skipped && r.probes.admin && r.probes.admin.status === 404),
    ],
  ];

  let total = 0;
  for (const [title, list] of findings) {
    const unexpected = list.filter((r) => {
      const label = `${r.method} ${r.path}`;
      const known = KNOWN_OK.find((entry) => entry.match(label));
      if (known) {
        console.log(`\n  expected: ${label} — ${known.reason}`);
        return false;
      }
      return true;
    });
    total += unexpected.length;
    console.log(`\n=== ${title} (${unexpected.length}${list.length > unexpected.length ? `, ${list.length - unexpected.length} expected` : ''}) ===`);
    for (const r of unexpected) {
      const probeLine = Object.entries(r.probes)
        .map(([who, p]) => `${who}:${p.status}${p.message ? ` ${p.message.slice(0, 60)}` : ''}`)
        .join(' | ');
      console.log(`${r.method.padEnd(6)} ${r.path}\n         ${probeLine}`);
    }
  }

  const distribution = {};
  for (const r of results) {
    for (const p of Object.values(r.probes)) distribution[p.status] = (distribution[p.status] || 0) + 1;
  }
  if (unprobed.length) {
    console.log(`\n--- not probed (${unprobed.length}): no fixture row in this environment ---`);
    for (const entry of unprobed) console.log(`  ${entry.route.padEnd(56)} ${entry.reason}`);
  }

  console.log('\nstatus distribution:', JSON.stringify(distribution));
  console.log('skipped (mutating / costly):', results.filter((r) => r.skipped).length);
  console.log('full report:', reportFile);
  console.log(
    '\nNote: 404-with-admin-token entries are usually bad fixture ids rather than broken routes — ' +
      're-probe one with the right id before filing it.',
  );

  process.exit(total === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('sweep failed:', err);
  process.exit(2);
});
