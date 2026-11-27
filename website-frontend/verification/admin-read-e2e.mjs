import test from 'node:test';
import assert from 'node:assert/strict';

const gateway = (process.env.GATEWAY_URL || 'http://localhost:8888/api/v1').replace(/\/$/, '');
const userName = process.env.E2E_ADMIN_USERNAME;
const password = process.env.E2E_ADMIN_PASSWORD;

async function request(path, token, method = 'GET', body) {
  const response = await fetch(gateway + path, {
    method,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const content = await response.text();
  return { status: response.status, body: content ? JSON.parse(content) : null };
}

test('ADMIN reads Job and Trust moderation through Gateway without gaining SUPER_ADMIN access', {
  skip: !userName || !password ? 'Needs E2E_ADMIN_USERNAME/PASSWORD for read-only admin verification' : false,
}, async () => {
  const login = await request('/identity/auth/token', null, 'POST', { userName, password });
  assert.equal(login.status, 200, `ADMIN login HTTP ${login.status}`);
  const token = login.body.result?.token;
  assert.ok(token);
  for (const [listPath, detailPath, idField] of [
    ['/job/admin/jobs', '/job/admin/jobs/', 'job.jobId'],
    ['/trust/admin/reviews', '/trust/admin/reviews/', 'reviewId'],
    ['/trust/admin/reports', '/trust/admin/reports/', 'reportId'],
    ['/trust/admin/disputes', '/trust/admin/disputes/', 'disputeId'],
  ]) {
    const list = await request(listPath, token);
    assert.equal(list.status, 200, `${listPath} HTTP ${list.status}`);
    assert.ok(Array.isArray(list.body.result?.content), `${listPath} is not a Spring page`);
    const first = list.body.result.content[0];
    const id = idField.split('.').reduce((value, key) => value?.[key], first);
    if (id) assert.equal((await request(detailPath + id, token)).status, 200, `${detailPath} detail`);
  }
  const audit = await request('/trust/admin/audit-logs?page=0', token);
  assert.equal(audit.status, 200);
  assert.equal((await request('/identity/users?page=0', token)).status, 403);
  assert.equal((await request('/payment/admin/fee-policies', token)).status, 403);
  assert.equal((await request('/trust/admin/disputes', null)).status, 401);
});
