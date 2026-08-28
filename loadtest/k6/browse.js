import http from 'k6/http';
import { check } from 'k6';
import { API, WEB, jsonOpts } from './helpers.js';

/**
 * Browse scenario — public discovery traffic (no auth):
 * home page, listing, featured, detail, categories, search.
 *
 *   k6 run -e VUS=50 -e DURATION=1m loadtest/k6/browse.js
 */
export const options = {
  stages: [
    { duration: '20s', target: Number(__ENV.VUS || 50) },
    { duration: __ENV.DURATION || '1m', target: Number(__ENV.VUS || 50) },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.98'],
  },
};

export default function () {
  // SSR home page (frontend) — exercises Next + backend hydration calls.
  const home = http.get(WEB + '/en', { tags: { name: 'web.home' } });
  check(home, { 'home 200': (r) => r.status === 200 });

  // Listing (hot read path, indexed).
  const list = http.get(API + '/products?status=active&page=1&limit=20', jsonOpts(null, 'products.list'));
  const listOk = check(list, {
    'list 200': (r) => r.status === 200,
    'list has data': (r) => {
      try { return Array.isArray(r.json('data')) && r.json('data').length > 0; } catch (e) { return false; }
    },
  });

  const featured = http.get(API + '/products/featured', jsonOpts(null, 'products.featured'));
  check(featured, { 'featured 200': (r) => r.status === 200 });

  const cats = http.get(API + '/categories', jsonOpts(null, 'categories.list'));
  check(cats, { 'categories 200': (r) => r.status === 200 });

  if (listOk) {
    const id = list.json('data')[0].id;
    const detail = http.get(API + '/products/' + id, jsonOpts(null, 'products.detail'));
    check(detail, { 'detail 200': (r) => r.status === 200 });

    const bids = http.get(API + '/auctions/' + id + '/bids', jsonOpts(null, 'bids.list'));
    check(bids, { 'bids 200': (r) => r.status === 200 });
  }

  const search = http.get(API + '/products?search=truck&limit=10', jsonOpts(null, 'products.search'));
  check(search, { 'search 200': (r) => r.status === 200 });
}
