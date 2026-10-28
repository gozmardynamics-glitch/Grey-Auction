#!/usr/bin/env node
'use strict';

/**
 * Publishes the legal documents in content/legal/ as CMS content pages.
 *
 *   node tools/legal/load-legal.js              # create or update both pages
 *   node tools/legal/load-legal.js --dry-run    # show what would change
 *
 * Each file becomes one content page via PUT /content/:slug, which is the same
 * endpoint the admin legal-page editors use — so once loaded they are editable
 * in the admin console like any other page.
 *
 * Slugs produced: privacy-policy, data-protection (plus terms if added).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const LEGAL_DIR = path.join(ROOT, 'content', 'legal');
const API = (process.env.API || 'http://localhost:3001').replace(/\/+$/, '');
const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@greyauction.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
};

const dryRun = process.argv.includes('--dry-run');

async function call(routePath, { method = 'GET', token, body } = {}) {
  const res = await fetch(API + routePath, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  const message = json && typeof json === 'object' ? json.message ?? json.error : undefined;
  return {
    status: res.status,
    ok: res.ok,
    json,
    message: Array.isArray(message) ? message.join('; ') : String(message ?? ''),
  };
}

/** "privacy-policy.md" -> "privacy-policy" */
const slugOf = (file) => path.basename(file, '.md');

/** First H1 is the page title; the rest is the body. */
function splitTitle(markdown, fallback) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const index = lines.findIndex((line) => line.startsWith('# '));
  if (index === -1) return { title: fallback, body: markdown.trim() };
  const title = lines[index].slice(2).trim();
  const body = [...lines.slice(0, index), ...lines.slice(index + 1)].join('\n').trim();
  return { title, body };
}

async function main() {
  if (!fs.existsSync(LEGAL_DIR)) {
    console.error(`no content at ${path.relative(ROOT, LEGAL_DIR)}`);
    process.exit(1);
  }

  const files = fs.readdirSync(LEGAL_DIR).filter((file) => file.endsWith('.md')).sort();
  if (!files.length) {
    console.error('no markdown files found');
    process.exit(1);
  }

  const login = await call('/api/auth/login', { method: 'POST', body: ADMIN });
  if (!login.ok) {
    console.error(`admin login failed: HTTP ${login.status} ${login.message}`);
    process.exit(2);
  }
  const token = login.json.data.token;

  let published = 0;
  const failures = [];

  for (const file of files) {
    const slug = slugOf(file);
    const markdown = fs.readFileSync(path.join(LEGAL_DIR, file), 'utf8');
    const { title, body } = splitTitle(markdown, slug);

    if (!body) {
      failures.push(`${file}: no body content`);
      continue;
    }

    console.log(`  ${dryRun ? 'would publish' : 'publishing '} ${slug.padEnd(18)} ${title}`);
    console.log(`      ${body.split(/\n/).length} lines, ${body.length} characters`);

    if (dryRun) {
      published += 1;
      continue;
    }

    // isActive so the public route serves it; the admin editors can still edit.
    const res = await call(`/api/content/${slug}`, {
      method: 'PUT',
      token,
      body: { title, content: body, isActive: true },
    });
    if (res.ok) published += 1;
    else failures.push(`${slug}: ${res.status} ${res.message}`);
  }

  console.log(
    dryRun
      ? `\ndry run: ${published} page(s) ready`
      : `\npublished ${published} page(s)`,
  );
  console.log('  /en/privacy-policy   /en/data-protection   /en/complaints');

  if (failures.length) {
    console.log('\nnot published:');
    for (const failure of failures) console.log('  - ' + failure);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('load-legal failed:', err.message);
  process.exit(2);
});
