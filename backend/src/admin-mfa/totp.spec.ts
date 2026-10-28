import { hotp, base32Decode, base32Encode, verifyTotp, totpAt, generateSecret, counterAt } from './totp';

/**
 * Pinned to the reference vectors in RFC 6238 Appendix B (the SHA-1 column) and
 * RFC 4226 Appendix D. If these ever drift, every admin's authenticator stops
 * working — and nobody can get into the platform.
 */
describe('TOTP', () => {
  // "12345678901234567890" in ASCII, the RFC's shared secret.
  const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  it('reproduces the RFC 6238 SHA-1 vectors at 8 digits', () => {
    const vectors: Array<[number, string]> = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1111111111, '14050471'],
      [1234567890, '89005924'],
      [2000000000, '69279037'],
      [20000000000, '65353130'],
    ];
    for (const [seconds, expected] of vectors) {
      expect(totpAt(RFC_SECRET, seconds * 1000, 8)).toBe(expected);
    }
  });

  it('reproduces the RFC 4226 HOTP vectors', () => {
    const secret = base32Decode(RFC_SECRET);
    const expected = [
      '755224', '287082', '359152', '969429', '338314',
      '254676', '287922', '162583', '399871', '520489',
    ];
    expected.forEach((code, counter) => {
      expect(hotp(secret, counter)).toBe(code);
    });
  });

  it('round-trips base32', () => {
    const original = Buffer.from('The quick brown fox', 'utf8');
    expect(base32Decode(base32Encode(original))).toEqual(original);
  });

  it('rejects a code that does not match', () => {
    const secret = generateSecret();
    const now = 1_700_000_000_000;
    const good = totpAt(secret, now);
    const bad = good === '000000' ? '111111' : '000000';
    expect(verifyTotp(secret, bad, now)).toEqual({ valid: false, reason: 'mismatch' });
  });

  it('accepts one step of drift in either direction, and no more', () => {
    const secret = generateSecret();
    const period = 30_000;
    const now = 1_700_000_010_000;
    expect(verifyTotp(secret, totpAt(secret, now - period), now).valid).toBe(true);
    expect(verifyTotp(secret, totpAt(secret, now + period), now).valid).toBe(true);
    expect(verifyTotp(secret, totpAt(secret, now - 2 * period), now).valid).toBe(false);
    expect(verifyTotp(secret, totpAt(secret, now + 2 * period), now).valid).toBe(false);
  });

  it('refuses to replay a code at a step already used', () => {
    const secret = generateSecret();
    const now = 1_700_000_000_000;
    const code = totpAt(secret, now);
    const first = verifyTotp(secret, code, now);
    expect(first.valid).toBe(true);
    if (!first.valid) return;
    expect(verifyTotp(secret, code, now, first.counter)).toEqual({
      valid: false,
      reason: 'replay',
    });
  });

  it('ignores spacing and punctuation in the submitted code', () => {
    const secret = generateSecret();
    const now = 1_700_000_000_000;
    const code = totpAt(secret, now);
    expect(verifyTotp(secret, `${code.slice(0, 3)} ${code.slice(3)}`, now).valid).toBe(true);
  });

  it('treats a malformed code as malformed, not as a mismatch', () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, '12', Date.now())).toEqual({ valid: false, reason: 'malformed' });
  });

  it('produces a secret whose counter advances with the clock', () => {
    const secret = generateSecret();
    expect(counterAt(60_000)).toBe(2);
    expect(totpAt(secret, 0)).toHaveLength(6);
  });
});
