import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * RFC 4648 base32 and RFC 6238 TOTP, implemented directly.
 *
 * A TOTP verifier is a security primitive; pulling one in as a dependency would
 * be fine, but the algorithm is short, testable against the RFC's own vectors,
 * and here it can be type-checked and audited in place. `totp.spec.ts` pins it
 * to the RFC 6238 reference values.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
/** Accept the previous and next step, for clock drift. Never more. */
export const TOTP_WINDOW_STEPS = 1;

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = String(input).toUpperCase().replace(/[=\s-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A fresh shared secret: 20 random bytes, the RFC 4226 recommendation. */
export function generateSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

/** The counter for a given moment — the number of whole periods since the epoch. */
export function counterAt(atMs: number, period = TOTP_PERIOD_SECONDS): number {
  return Math.floor(atMs / 1000 / period);
}

/** HOTP (RFC 4226) for an explicit counter. */
export function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS): string {
  const buffer = Buffer.alloc(8);
  // 64-bit big-endian counter; writeUInt32BE covers the practical range and
  // keeps this clear of BigInt on the hot path.
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000) >>> 0, 0);
  buffer.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac('sha1', secret).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

/** The code for a moment in time — used by tests, seed scripts and support. */
export function totpAt(secretBase32: string, atMs: number, digits = TOTP_DIGITS): string {
  return hotp(base32Decode(secretBase32), counterAt(atMs), digits);
}

export type TotpVerification =
  | { valid: true; counter: number; reason?: undefined }
  | { valid: false; reason: 'malformed' | 'mismatch' | 'replay'; counter?: undefined };

/**
 * Verify a submitted code.
 *
 * `minCounter` is the last step already accepted for this account. A code from
 * that step or earlier is refused even though it still matches the HMAC — that
 * replay guard is what stops an observed code being reused inside its 30-second
 * window, or after a shoulder-surf.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  atMs: number,
  minCounter = 0,
  options: { window?: number; digits?: number } = {},
): TotpVerification {
  const digits = options.digits ?? TOTP_DIGITS;
  const window = options.window ?? TOTP_WINDOW_STEPS;
  const submitted = String(code ?? '').replace(/\D/g, '');
  if (submitted.length !== digits) return { valid: false, reason: 'malformed' };

  let secret: Buffer;
  try {
    secret = base32Decode(secretBase32);
  } catch {
    return { valid: false, reason: 'mismatch' };
  }

  const current = counterAt(atMs);
  let matchedReplay = false;
  for (let offset = -window; offset <= window; offset += 1) {
    const counter = current + offset;
    if (counter < 0) continue;
    const expected = hotp(secret, counter, digits);
    const a = Buffer.from(expected);
    const b = Buffer.from(submitted);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      if (counter <= minCounter) {
        matchedReplay = true;
        continue;
      }
      return { valid: true, counter };
    }
  }
  return { valid: false, reason: matchedReplay ? 'replay' : 'mismatch' };
}

/** `otpauth://` URI for the authenticator app's QR code. */
export function otpauthUrl(params: {
  secret: string;
  account: string;
  issuer?: string;
  digits?: number;
  period?: number;
}): string {
  const issuer = params.issuer || 'GreyAuction';
  const label = encodeURIComponent(`${issuer}:${params.account}`);
  const query = new URLSearchParams({
    secret: params.secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(params.digits ?? TOTP_DIGITS),
    period: String(params.period ?? TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
