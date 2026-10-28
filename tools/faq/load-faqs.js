#!/usr/bin/env node
'use strict';

/**
 * Loads content/faqs.json into the running app as real FAQ content.
 *
 *   node tools/faq/load-faqs.js              # create or update every entry
 *   node tools/faq/load-faqs.js --dry-run    # show what would change
 *   node tools/faq/load-faqs.js --reset      # delete the entries this file owns
 *
 * It goes through the admin API (the same endpoints the admin console uses)
 * rather than writing rows, so the public page and the admin table stay in step.
 *
 * Identity is the question text: an entry that already exists is updated in
 * place, so re-running never duplicates rows. `--reset` only removes questions
 * listed in this file — FAQs an administrator wrote by hand are never touched.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONTENT = path.join(ROOT, 'content', 'faqs.json');
const API = (process.env.API || 'http://localhost:3001').replace(/\/+$/, '');
const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@greyauction.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
};

const dryRun = process.argv.includes('--dry-run');
const reset = process.argv.includes('--reset');

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

async function login() {
  const res = await call('/api/auth/login', { method: 'POST', body: ADMIN });
  if (!res.ok) throw new Error(`admin login failed: HTTP ${res.status} ${res.message}`);
  return res.json.data.token;
}

const rows = (json) => {
  const data = json?.data ?? json;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

const key = (question) => String(question || '').trim().toLowerCase();

async function main() {
  const content = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  const flat = [];
  let order = 0;
  for (const category of content.categories) {
    for (const item of category.items) {
      order += 1;
      flat.push({
        category: category.name,
        emoji: category.emoji,
        audience: content.meta?.audiences?.[slug(category.name)] || 'all',
        order,
        question: item.question,
        answer: item.answer,
        isActive: true,
      });
    }
  }

  const token = await login();
  const existing = rows((await call('/api/admin/faqs', { token })).json);
  const byQuestion = new Map(existing.map((row) => [key(row.question), row]));
  const managed = new Set(flat.map((entry) => key(entry.question)));

  console.log(`${API} — ${flat.length} entries in ${content.categories.length} categories, ${existing.length} FAQs live`);

  if (reset) {
    let removed = 0;
    for (const row of existing) {
      if (!managed.has(key(row.question))) continue; // never touch hand-written FAQs
      if (dryRun) {
        console.log(`  would delete  ${row.question}`);
        continue;
      }
      const res = await call(`/api/admin/faqs/${row.id}`, { method: 'DELETE', token });
      if (res.ok) removed += 1;
      else console.log(`  FAIL delete  ${row.question} — ${res.status} ${res.message}`);
    }
    console.log(dryRun ? 'dry run: nothing deleted' : `deleted ${removed} entries`);
    return;
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const failures = [];

  for (const entry of flat) {
    const current = byQuestion.get(key(entry.question));
    const body = {
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      order: entry.order,
      isActive: true,
    };

    if (!current) {
      if (dryRun) {
        console.log(`  would create  [${entry.category}] ${entry.question}`);
        created += 1;
        continue;
      }
      const res = await call('/api/admin/faqs', { method: 'POST', token, body });
      if (res.ok) {
        created += 1;
      } else {
        failures.push(`${entry.question}: ${res.status} ${res.message}`);
      }
      continue;
    }

    const same =
      current.category === entry.category &&
      current.answer === entry.answer &&
      Number(current.order) === entry.order &&
      current.isActive === true;
    if (same) {
      unchanged += 1;
      continue;
    }

    if (dryRun) {
      console.log(`  would update  [${entry.category}] ${entry.question}`);
      updated += 1;
      continue;
    }
    const res = await call(`/api/admin/faqs/${current.id}`, { method: 'PATCH', token, body });
    if (res.ok) updated += 1;
    else failures.push(`${entry.question}: ${res.status} ${res.message}`);
  }

  console.log(
    dryRun
      ? `dry run: ${created} to create, ${updated} to update, ${unchanged} unchanged`
      : `created ${created}, updated ${updated}, unchanged ${unchanged}`,
  );

  // Grouping is by category name, so an empty category cannot appear; report the
  // shape so a missing category is obvious rather than silent.
  const counts = {};
  for (const entry of flat) counts[entry.category] = (counts[entry.category] || 0) + 1;
  for (const [category, count] of Object.entries(counts)) console.log(`  ${category.padEnd(30)} ${count}`);

  if (failures.length) {
    console.log('\nnot loaded:');
    for (const failure of failures) console.log('  - ' + failure);
    process.exit(1);
  }
  console.log('\npublic page: /en/faq   admin table: /en/admin/faqs');
}

/** "Private rooms and invitations" -> "private-rooms-and-invitations" */
function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

main().catch((err) => {
  console.error('load-faqs failed:', err.message);
  process.exit(2);
});
