import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { API, jsonOpts, registerLoadUser, pickActiveProductId, bidResponseCallback } from './helpers.js';

/**
 * Hot-auction bidding scenario — the scale-critical path:
 * many authenticated buyers racing to outbid each other on ONE lot,
 * exercising the optimistic-lock (VersionColumn) + proxy-bid engine.
 *
 *   k6 run -e BIDDERS=100 -e HOLD=2m loadtest/k6/bidding.js
 *
 * Prereq: backend up + at least one ACTIVE product (seed:demo creates one).
 */
const bidAccepted = new Counter('bids_accepted');
const bidConflict = new Counter('bids_conflict'); // expected 400s (stale amount)
const bidLatency = new Trend('bid_duration', true);

export const options = {
  setupTimeout: '120s',
  stages: [
    { duration: '15s', target: Number(__ENV.BIDDERS || 100) },
    { duration: __ENV.HOLD || '2m', target: Number(__ENV.BIDDERS || 100) },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    // Server errors only — conflicts are filtered via responseCallback.
    http_req_failed: ['rate<0.01'],
    bid_duration: ['p(95)<400', 'p(99)<800'],
    // At least some bids must win through the contention (sanity: engine works).
    bids_accepted: ['count>0'],
  },
};

export function setup() {
  const n = Number(__ENV.BIDDERS || 100);
  const tokens = [];
  for (let i = 0; i < n; i++) {
    const t = registerLoadUser(i);
    if (t) tokens.push(t);
  }
  if (!tokens.length) throw new Error('No bidder tokens: is the backend up and /auth/register reachable?');
  const productId = pickActiveProductId();
  if (!productId) throw new Error('No ACTIVE product to bid on — run: npm run seed:demo (backend)');
  return { tokens, productId };
}

export default function (data) {
  const token = data.tokens[__ITER % data.tokens.length];

  // Read the live price, then bid one increment above it.
  const prod = http.get(API + '/products/' + data.productId, jsonOpts(null, 'products.detail'));
  if (prod.status !== 200) return;
  const current = Number(prod.json('currentBid')) || Number(prod.json('startingBid')) || 0;
  const amount = Math.round((current + 1000 + Math.random() * 5000) * 100) / 100;

  const res = http.post(
    API + '/auctions/' + data.productId + '/bids',
    JSON.stringify({ amount }),
    Object.assign(jsonOpts(token, 'bids.place'), { responseCallback: bidResponseCallback }),
  );
  bidLatency.add(res.timings.duration);

  if (res.status === 201 || res.status === 200) {
    bidAccepted.add(1);
    check(res, { 'bid accepted': (r) => r.json('success') === true });
  } else if (res.status === 400 || res.status === 409) {
    bidConflict.add(1); // outbid mid-flight — correct engine behaviour
  } else {
    check(res, { 'bid unexpected status': (r) => r.status < 400 });
  }
}

export function handleSummary(summary) {
  return {
    'loadtest/results/bidding-summary.json': JSON.stringify(summary.metrics, null, 2),
    stdout:
      '\n=== Bidding load summary ===\n' +
      'bids accepted : ' + (summary.metrics.bids_accepted.values.count || 0) + '\n' +
      'bids conflict : ' + (summary.metrics.bids_conflict.values.count || 0) + '\n' +
      'bid p95 (ms)  : ' + (summary.metrics.bid_duration.values['p(95)'] || 0).toFixed(1) + '\n' +
      'server errors : ' + (summary.metrics.http_req_failed.values.rate * 100).toFixed(2) + '%\n',
  };
}
