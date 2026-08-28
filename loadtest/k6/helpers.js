import http from 'k6/http';
import { check } from 'k6';

/** Shared config + helpers for GreyAuction k6 scenarios. */

export const API = __ENV.API_BASE_URL || 'http://localhost:3001/api';
export const WEB = __ENV.WEB_BASE_URL || 'http://localhost:3000';

/** JSON request options with a stable operation tag for per-endpoint thresholds. */
export function jsonOpts(token, name) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return { headers, tags: { name } };
}

export function login(email, password) {
  const res = http.post(
    API + '/auth/login',
    JSON.stringify({ email, password }),
    jsonOpts(null, 'auth.login'),
  );
  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  if (!ok) return null;
  return res.json('data.token');
}

/** Register a throwaway load-test buyer; returns its JWT (or null). */
export function registerLoadUser(i) {
  const stamp = __ENV.LOAD_STAMP || String(Date.now());
  const email = 'load-' + stamp + '-' + i + '@greyauction.test';
  const password = 'Loadtest@12345';
  const res = http.post(
    API + '/auth/register',
    // role omitted: UserRole enum is bidder|seller|admin; default (bidder) can bid.
    JSON.stringify({ email, password, name: 'Load Tester ' + i }),
    jsonOpts(null, 'auth.register'),
  );
  if (res.status === 201 || res.status === 200) {
    try {
      return res.json('data.token');
    } catch (e) {
      return null;
    }
  }
  // Already registered from a previous run: fall back to login.
  return login(email, password);
}

/** Pick a random ACTIVE product id (the "hot auction" everyone bids on). */
export function pickActiveProductId() {
  const res = http.get(API + '/products?status=active&limit=20', jsonOpts(null, 'products.list'));
  if (res.status !== 200) return null;
  const items = res.json('data');
  if (!items || !items.length) return null;
  return items[Math.floor(Math.random() * items.length)].id;
}

/**
 * Bid conflicts (400 "Bid must be higher") are EXPECTED under contention —
 * the proxy-bid engine rejects stale amounts. Tell k6 not to count them as
 * request failures so http_req_failed stays a true server-error signal.
 */
export function bidResponseCallback(res) {
  return res.status < 400 || res.status === 400 || res.status === 409;
}
