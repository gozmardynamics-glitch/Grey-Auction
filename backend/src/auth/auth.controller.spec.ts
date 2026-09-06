import 'reflect-metadata';
import { AuthController } from './auth.controller';

/**
 * G49 brute-force damping contract.
 *
 * Every unauthenticated auth endpoint must carry a per-IP @Throttle override
 * tighter than the global default (100/min set in app.module.ts). The
 * assertions read the metadata @nestjs/throttler v6 writes:
 *   THROTTLER:LIMIT<name> / THROTTLER:TTL<name>  (name = 'default')
 */
const LIMIT_KEY = 'THROTTLER:LIMITdefault';
const TTL_KEY = 'THROTTLER:TTLdefault';

const limitOf = (method: string): { limit: number; ttl: number } => {
  const proto = AuthController.prototype as unknown as Record<string, unknown>;
  const handler = proto[method];
  if (!handler) throw new Error(`AuthController.${method} not found`);
  return {
    limit: Reflect.getMetadata(LIMIT_KEY, handler) as number,
    ttl: Reflect.getMetadata(TTL_KEY, handler) as number,
  };
};

describe('auth controller rate limiting (G49)', () => {
  it('throttles credential-stuffing surfaces per IP', () => {
    expect(limitOf('login').limit).toBe(10);
    expect(limitOf('register').limit).toBe(5);
    expect(limitOf('googleLogin').limit).toBe(10);
  });

  it('throttles email-sending and token endpoints tightly', () => {
    expect(limitOf('forgotPassword').limit).toBe(3);
    expect(limitOf('resetPassword').limit).toBe(5);
    expect(limitOf('sendOtp').limit).toBe(3);
    expect(limitOf('verifyOtp').limit).toBe(5);
  });

  it('keeps every damped endpoint a 1-minute window', () => {
    for (const method of ['login', 'register', 'googleLogin', 'forgotPassword', 'resetPassword', 'sendOtp', 'verifyOtp']) {
      expect(limitOf(method).ttl).toBe(60000);
    }
  });

  it('keeps every damped endpoint tighter than the global default (100/min)', () => {
    for (const method of ['login', 'register', 'googleLogin', 'forgotPassword', 'resetPassword', 'sendOtp', 'verifyOtp']) {
      expect(limitOf(method).limit).toBeLessThan(100);
    }
  });
});
