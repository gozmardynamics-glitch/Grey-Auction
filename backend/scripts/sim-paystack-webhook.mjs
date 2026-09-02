#!/usr/bin/env node
/**
 * U5 physical-test helper — simulate a Paystack charge.success webhook.
 *
 * Usage (from backend/):
 *   node scripts/sim-paystack-webhook.mjs --ref <paymentReference> [--amount 1500] [--secret <key>]
 *
 * Secret resolution order:
 *   1. --secret argument
 *   2. PAYSTACK_SECRET_KEY from backend/.env
 *   3. 'itest-secret-key-123' (matches the local test secret used when the
 *      real key is temporarily disabled for offline init testing)
 */
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
function argOf(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

function readEnvSecret() {
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const m = env.match(/^PAYSTACK_SECRET_KEY=(.*)$/m);
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : '';
  } catch {
    return '';
  }
}

const reference = argOf('--ref', '');
const amountNaira = Number(argOf('--amount', '1500'));
const apiBase = argOf('--api', 'http://localhost:3001/api');
const secret = argOf('--secret', readEnvSecret() || 'itest-secret-key-123');

if (!reference) {
  console.error('Missing --ref <paymentReference>');
  process.exit(1);
}

const payload = {
  event: 'charge.success',
  data: { reference, amount: Math.round(amountNaira * 100) },
};
const raw = JSON.stringify(payload);
const signature = createHmac('sha512', secret).update(raw).digest('hex');

const res = await fetch(`${apiBase}/payments/webhook/paystack`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
  body: raw,
});

console.log('POST', `${apiBase}/payments/webhook/paystack`);
console.log('status:', res.status);
console.log('body:', await res.text());