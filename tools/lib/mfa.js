#!/usr/bin/env node
'use strict';

/**
 * Administrator sign-in for the local tooling.
 *
 * Administrators now need a second factor, so every script that used to post a
 * password is one release away from failing with "MFA_REQUIRED". This module is
 * the one place that knows how to answer it.
 *
 * The shared secret is read from `ADMIN_MFA_SECRET`, or from the local
 * `.admin-mfa-secret` file that `tools/admin/enrol-mfa.js` writes. In a
 * development checkout that is convenient; in production you would provision
 * the variable from your secret store, or not run these scripts at all.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SECRET_FILE = path.join(ROOT, '.admin-mfa-secret');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/[=\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Not a valid base32 secret');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function codeForCounter(secret, counter) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000) >>> 0, 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}

/** The code for right now, or for a later step when `offset` is set. */
function currentCode(secret, offset = 0) {
  const counter = Math.floor(Date.now() / 1000 / 30) + offset;
  return codeForCounter(secret, counter);
}

function readSecret(explicit) {
  if (explicit) return explicit;
  if (process.env.ADMIN_MFA_SECRET) return process.env.ADMIN_MFA_SECRET.trim();
  try {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } catch {
    return null;
  }
}

/**
 * Sign in, answering the second-factor challenge when the API asks for one.
 *
 * `post` is the caller's own request helper so this stays transport-agnostic:
 * `(path, { method, body }) => { ok, status, json, message }`.
 */
async function adminLogin(post, email, password, options = {}) {
  const secret = readSecret(options.secret);
  let code = options.code;

  if (!code && secret) {
    // Half a minute either side of the boundary the first code can be rejected
    // as "already used" — step forward once before giving up.
    for (const offset of [0, 1]) {
      const res = await post('/api/auth/login', {
        method: 'POST',
        body: { email, password, code: currentCode(secret, offset) },
      });
      if (res.ok) return res.json.data.token;
      if (res.status !== 401) {
        throw new Error(`login failed for ${email}: HTTP ${res.status} ${res.message ?? ''}`);
      }
    }
    throw new Error(
      `login failed for ${email}: the two-factor code was rejected. ` +
        'Check that ADMIN_MFA_SECRET (or .admin-mfa-secret) matches the account.',
    );
  }

  const res = await post('/api/auth/login', {
    method: 'POST',
    body: { email, password, ...(code ? { code } : {}) },
  });
  if (res.ok) return res.json.data.token;

  if (res.json?.code === 'MFA_REQUIRED') {
    throw new Error(
      `${email} requires a two-factor code. Set ADMIN_MFA_SECRET, or run ` +
        '`node tools/admin/enrol-mfa.js` to set this machine up.',
    );
  }
  if (res.json?.code === 'MFA_ENROLMENT_REQUIRED') {
    throw new Error(
      `${email} has not set up two-factor authentication yet. Run ` +
        '`node tools/admin/enrol-mfa.js`.',
    );
  }
  throw new Error(`login failed for ${email}: HTTP ${res.status} ${res.message ?? ''}`);
}

function saveSecret(secret) {
  fs.writeFileSync(SECRET_FILE, `${secret}\n`, { encoding: 'utf8', mode: 0o600 });
}

module.exports = {
  adminLogin,
  currentCode,
  codeForCounter,
  base32Decode,
  readSecret,
  saveSecret,
  SECRET_FILE,
};
