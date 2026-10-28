'use strict';

/**
 * Minimal API client for the fixture seeder.
 *
 * Everything talks to the running dev server over HTTP rather than writing rows
 * directly, so seeding also exercises the real guards, DTOs and side effects.
 */

const fs = require('fs');
const path = require('path');
const { adminLogin } = require('../../tools/lib/mfa');

const API = (process.env.TESTFILL_API || 'http://localhost:3001').replace(/\/+$/, '');

const ACCOUNTS = {
  admin: {
    email: process.env.TESTFILL_ADMIN_EMAIL || 'admin@greyauction.com',
    password: process.env.TESTFILL_ADMIN_PASSWORD || 'Admin@12345',
  },
  seller: {
    email: process.env.TESTFILL_SELLER_EMAIL || 'phase1.seller@greyauction.dev',
    password: process.env.TESTFILL_SELLER_PASSWORD || 'Phase1@12345',
  },
  buyer: {
    email: process.env.TESTFILL_BUYER_EMAIL || 'phase4.buyer@greyauction.dev',
    password: process.env.TESTFILL_BUYER_PASSWORD || 'Phase4@12345',
  },
};

async function call(routePath, { method = 'GET', token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form; // FormData: let fetch set the boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(API + routePath, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, json, message: messageOf(json) };
}

function messageOf(json) {
  if (!json || typeof json !== 'object') return typeof json === 'string' ? json.slice(0, 200) : '';
  const raw = json.message ?? json.error;
  return (Array.isArray(raw) ? raw.join('; ') : String(raw ?? '')).slice(0, 200);
}

const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Multipart upload from a local file.
 *
 * The MIME type has to be set explicitly: `new Blob([buffer])` defaults to
 * application/octet-stream, which the storage allow-list rejects.
 */
function fileForm(filePath, fields = {}, fieldName = 'file') {
  const form = new FormData();
  const type = MIME_BY_EXT[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  form.append(fieldName, new Blob([fs.readFileSync(filePath)], { type }), path.basename(filePath));
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, String(value));
  }
  return form;
}

async function login(role, attempt = 1) {
  const account = ACCOUNTS[role];
  if (!account) throw new Error(`unknown role ${role}`);
  if (role === 'admin') {
    // Administrators must answer a second factor; tools/lib/mfa.js supplies it
    // from ADMIN_MFA_SECRET, or from the local .admin-mfa-secret file.
    const token = await adminLogin(call, account.email, account.password);
    const me = await call('/api/auth/me', { token });
    return { ...(me.json?.data ?? {}), token };
  }
  const res = await call('/api/auth/login', { method: 'POST', body: account });
  if (res.ok) return { ...res.json.data.user, token: res.json.data.token };
  // /api/auth/login is throttled (5/min per IP); wait it out rather than fail.
  if (res.status === 429 && attempt <= 3) {
    console.log(`  … login throttled for ${account.email}, waiting 30s`);
    await new Promise((r) => setTimeout(r, 30000));
    return login(role, attempt + 1);
  }
  throw new Error(`login failed for ${account.email}: HTTP ${res.status} ${res.message}`);
}

/** Assert a requirement, quoting the API's own message when it fails. */
function expectOk(res, what) {
  if (!res.ok) {
    throw new Error(`${what} → HTTP ${res.status}${res.message ? `: ${res.message}` : ''}`);
  }
  return res.json?.data ?? res.json;
}

module.exports = { API, ACCOUNTS, call, login, fileForm, expectOk, messageOf };
