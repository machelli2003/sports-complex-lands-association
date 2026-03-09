import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500']
  }
};

const BASE = __ENV.BASE_URL || 'http://localhost:5001';

export default function () {
  // Example: simple search and create flow to exercise API endpoints
  let res = http.get(`${BASE}/api/clients/search?query=Test`);
  check(res, { 'search ok': (r) => r.status === 200 });

  // Simulate adding a payment (requires valid client id in real runs)
  const payload = JSON.stringify({
    client_id: __ENV.TEST_CLIENT_ID || 'dummy',
    stage_id: __ENV.TEST_STAGE_ID || 'dummy',
    payment_type: 'Registration',
    amount: 10.0,
    receipt_number: `k6-${__VU}-${__ITER}`
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  res = http.post(`${BASE}/api/payments`, payload, params);
  check(res, { 'payment accepted': (r) => r.status === 200 || r.status === 201 || r.status === 400 });

  sleep(1);
}
