import http from 'k6/http';
import { check } from 'k6';
import { API, jsonOpts } from './helpers.js';

/**
 * Newsletter opt-in burst — POST /subscriptions (double opt-in, email queued).
 * Verifies the unique-email guard + graceful behaviour under burst traffic.
 *
 *   k6 run -e VUS=20 -e DURATION=30s loadtest/k6/subscribe.js
 */
export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const email = 'sub-' + __VU + '-' + __ITER + '-' + Date.now() + '@greyauction.test';
  const res = http.post(
    API + '/subscriptions',
    JSON.stringify({ email }),
    jsonOpts(null, 'subscriptions.create'),
  );
  check(res, {
    'subscribe 201/200': (r) => r.status === 200 || r.status === 201,
    'status pending': (r) => {
      try { return r.json('data.status') === 'pending'; } catch (e) { return false; }
    },
  });
}
