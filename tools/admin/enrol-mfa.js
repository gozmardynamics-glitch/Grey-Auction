#!/usr/bin/env node
'use strict';

/**
 * Set up two-factor authentication for an administrator account, from a
 * terminal.
 *
 *   node tools/admin/enrol-mfa.js                       # uses ADMIN_EMAIL / ADMIN_PASSWORD
 *   node tools/admin/enrol-mfa.js --email a@b.c --print
 *
 * Prints the otpauth URI — paste it into your authenticator, or render it as a
 * QR code — and the recovery codes. On a development machine the shared secret
 * is also written to `.admin-mfa-secret` (git-ignored) so the other scripts can
 * sign in without a phone. Do not do that anywhere real: the whole point of a
 * second factor is that the secret lives on your device and nowhere else.
 *
 * If the account is already enrolled this exits with an explanation rather than
 * silently doing nothing — re-enrolment from a terminal is the documented reset
 * path in docs/complaints and the deployment checklist.
 */

const fs = require('fs');
const path = require('path');
const { saveSecret, SECRET_FILE, currentCode } = require('../lib/mfa');

const ROOT = path.join(__dirname, '..', '..');
const API = (process.env.API || 'http://localhost:3001').replace(/\/+$/, '');

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const EMAIL = arg('email', process.env.ADMIN_EMAIL || 'admin@greyauction.com');
const PASSWORD = arg('password', process.env.ADMIN_PASSWORD || 'Admin@12345');
const PRINT_ONLY = process.argv.includes('--print');

async function post(routePath, { method = 'POST', body } = {}) {
  const res = await fetch(API + routePath, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { ok: res.ok, status: res.status, json, message: json?.message || text.slice(0, 200) };
}

function loadEnvFile() {
  // The backend's .env holds the database name; only used for the guidance text.
  return fs.existsSync(path.join(ROOT, 'backend', '.env'));
}

(async () => {
  const begin = await post('/api/auth/mfa/enrol/begin', { body: { email: EMAIL, password: PASSWORD } });

  if (!begin.ok) {
    if (String(begin.json?.message || '').includes('already set up')) {
      console.error(`\n${EMAIL} already has two-factor authentication.`);
      console.error('To start over, clear the enrolment columns on that admin row');
      console.error('(mfaEnabled, mfaSecret, mfaRecoveryCodes, mfaEnrolledAt, mfaLastStep)');
      console.error('and run this again. That is a deliberate, audited reset.');
      process.exit(1);
    }
    console.error(`\nEnrolment failed: HTTP ${begin.status} ${begin.message}`);
    if (begin.json?.code === 'MFA_ENROLMENT_REQUIRED') {
      console.error('(Check the email and password.)');
    }
    process.exit(1);
  }

  const { secret, otpauthUrl, recoveryCodes } = begin.json.data;

  console.log('\nAdd this account to your authenticator app:\n');
  console.log(`  ${otpauthUrl}\n`);
  console.log(`  secret: ${secret}`);

  console.log('\nRecovery codes — store them somewhere safe. Each works once.\n');
  for (const code of recoveryCodes) console.log(`  ${code}`);

  if (!PRINT_ONLY) {
    saveSecret(secret);
    console.log(`\nShared secret written to ${SECRET_FILE}`);
    console.log('(development only — never commit it, never use it in production)');
  }

  console.log('\nFinish by signing in with a code, which arms the factor:');
  console.log(`  curl -s -X POST ${API}/api/auth/login \\`);
  console.log(`    -H 'content-type: application/json' \\`);
  console.log(`    -d '{"email":"${EMAIL}","password":"…","code":"${currentCode(secret)}"}'`);
  if (!loadEnvFile()) {
    console.log('\n(note: no backend/.env found — set API_URL if the API is not on localhost:3001)');
  }
})().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
