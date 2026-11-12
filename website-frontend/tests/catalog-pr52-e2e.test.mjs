// catalog-service after PR #52: PATCH status, owner checks, keyword search,
// rules that generate slots, slot window, admin-only categories.
// Needs the backend (gateway + identity + catalog) and the Postgres containers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8888/api/v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const ts = Date.now().toString(36);

let providerToken = '';
let adminToken = '';
let providerId = '';
let categoryId = '';
const created = { services: [], categories: [] };

function queryCatalogDb(sql) {
  const cmd = `docker exec catalog-postgres psql -U postgres -d catalog_db -t -A -c "${sql.replace(/"/g, '\\"')}"`;
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

async function api(method, path, { token, body, params } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${GATEWAY_URL}${path}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, code: json?.code, result: json?.result };
}

async function login(userName, password) {
  const res = await api('POST', '/identity/auth/token', { body: { userName, password } });
  assert.ok(res.result?.token, `login failed for ${userName}`);
  return res.result.token;
}

const jwtClaims = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'));

async function createService(executionType, title) {
  const res = await api('POST', '/catalog/services', {
    token: providerToken,
    body: { categoryId, executionType, title, slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${ts}`, description: 'E2E', basePrice: 100000, currency: 'VND' },
  });
  assert.equal(res.code, 1000, `create ${executionType} service failed: ${res.code}`);
  created.services.push(res.result.serviceId);
  return res.result.serviceId;
}

// Tomorrow in UTC+7 (the backend reads rule times at +7), as the catalog
// day-of-week (2 = Monday … 8 = Sunday) and the [00:00, 24:00) +7 window.
function tomorrowVn() {
  const vnNow = new Date(Date.now() + VN_OFFSET_MS);
  const day = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + 1));
  const jsDay = day.getUTCDay();
  const from = new Date(day.getTime() - VN_OFFSET_MS);
  return { dayOfWeek: jsDay === 0 ? 8 : jsDay + 1, from: from.toISOString(), to: new Date(from.getTime() + DAY_MS - 1).toISOString() };
}

// "08:00" at +7 as the Instant on 1970-01-01 a rule stores.
const ruleTime = (hour) => new Date(Date.UTC(1970, 0, 1, hour) - VN_OFFSET_MS).toISOString();

async function slotsOf(serviceId, params = {}) {
  const res = await api('GET', `/catalog/slots/services/${serviceId}`, { params: { page: 0, size: 100, ...params } });
  assert.equal(res.code, 1000);
  return res.result.data;
}

test.before(async () => {
  providerToken = await login('nguyenvana', 'Provider@123');
  adminToken = await login('admin', 'admin');
  providerId = jwtClaims(providerToken).providerId;
  assert.ok(providerId, 'provider token has no providerId claim');
  const roots = await api('GET', '/catalog/categories/roots', { params: { page: 0, size: 50 } });
  categoryId = roots.result?.data?.[0]?.categoryId;
  assert.ok(categoryId, 'no root category to create services in');
});

test.after(async () => {
  for (const id of created.services) {
    try {
      queryCatalogDb(`DELETE FROM booking_slots WHERE service_id = '${id}'`);
    } catch {
      // DB cleanup is best effort; the soft delete below still hides the service.
    }
    await api('DELETE', `/catalog/services/${id}`, { token: providerToken });
  }
  for (const id of created.categories) await api('DELETE', `/catalog/categories/${id}`, { token: adminToken });
});

test('GET /catalog/services without filters returns only PUBLISHED, paged', async () => {
  const res = await api('GET', '/catalog/services', { params: { page: 0, size: 100 } });
  assert.equal(res.code, 1000);
  assert.ok(res.result.data.length > 0, 'no published services');
  assert.ok(res.result.data.every((s) => s.status === 'PUBLISHED'));
  assert.equal(typeof res.result.totalPages, 'number');
});

test('keyword filters by title', async () => {
  const all = await api('GET', '/catalog/services', { params: { page: 0, size: 1 } });
  const first = all.result.data[0];
  const keyword = first.title.slice(0, 5).toLowerCase();
  const res = await api('GET', '/catalog/services', { params: { keyword, page: 0, size: 100 } });
  assert.equal(res.code, 1000);
  assert.ok(res.result.data.some((s) => s.serviceId === first.serviceId), `"${keyword}" did not find ${first.title}`);
});

test('provider PATCHes own service status and it leaves/returns to the listing', async () => {
  const title = `E2E Patch ${ts}`;
  const id = await createService('DIGITAL', title);
  const listed = async () =>
    (await api('GET', '/catalog/services', { params: { keyword: title, page: 0, size: 10 } })).result.data.some((s) => s.serviceId === id);

  const published = await api('PATCH', `/catalog/services/${id}/status`, { token: providerToken, body: { status: 'PUBLISHED' } });
  assert.equal(published.code, 1000);
  assert.equal(published.result.status, 'PUBLISHED');
  assert.ok(published.result.publishedAt, 'publishedAt not set');
  assert.equal(await listed(), true);

  const paused = await api('PATCH', `/catalog/services/${id}/status`, { token: providerToken, body: { status: 'PAUSED' } });
  assert.equal(paused.result.status, 'PAUSED');
  assert.equal(await listed(), false);
});

test("PATCH on another provider's service → 403 code 1025", async () => {
  const all = await api('GET', '/catalog/services', { params: { page: 0, size: 100 } });
  const other = all.result.data.find((s) => s.providerId !== providerId);
  assert.ok(other, 'no published service owned by another provider');
  const res = await api('PATCH', `/catalog/services/${other.serviceId}/status`, { token: providerToken, body: { status: 'PAUSED' } });
  assert.equal(res.status, 403);
  assert.equal(res.code, 1025);
});

test('PATCH with status null → 1026', async () => {
  const id = await createService('DIGITAL', `E2E Null ${ts}`);
  const res = await api('PATCH', `/catalog/services/${id}/status`, { token: providerToken, body: { status: null } });
  assert.equal(res.code, 1026);
});

test('rule create generates slots, update keeps booked ones, delete removes open ones', async () => {
  const id = await createService('ONSITE', `E2E Rule ${ts}`);
  const day = tomorrowVn();
  const window = { from: day.from, to: day.to };
  const rule = { status: 'ACTIVE', slotDurationMinute: 60, dayOfWeek: day.dayOfWeek, startTime: ruleTime(8), endTime: ruleTime(10) };

  const createdRule = await api('POST', `/catalog/rules/services/${id}`, { token: providerToken, body: rule });
  assert.equal(createdRule.code, 1000);
  const ruleId = createdRule.result.availableRuleId;

  const first = await slotsOf(id, window);
  assert.equal(first.length, 2);
  assert.ok(first.every((s) => s.status === 'AVAILABLE' && s.availableRuleId === ruleId));

  const booked = first[0];
  queryCatalogDb(`UPDATE booking_slots SET status = 'BOOKED' WHERE booking_slot_id = '${booked.bookingSlotId}'`);

  const updated = await api('PUT', `/catalog/rules/${ruleId}`, { token: providerToken, body: { ...rule, endTime: ruleTime(11) } });
  assert.equal(updated.code, 1000);
  const second = await slotsOf(id, window);
  assert.equal(second.length, 3);
  assert.equal(new Set(second.map((s) => s.startedAt)).size, 3, 'two slots share a start time');
  assert.equal(second.find((s) => s.bookingSlotId === booked.bookingSlotId)?.status, 'BOOKED');

  const removed = await api('DELETE', `/catalog/rules/${ruleId}`, { token: providerToken });
  assert.equal(removed.code, 1000);
  const third = await slotsOf(id, window);
  assert.deepEqual(third.map((s) => s.bookingSlotId), [booked.bookingSlotId]);
});

test('rule validation codes', async () => {
  const id = await createService('ONSITE', `E2E Valid ${ts}`);
  const base = { status: 'ACTIVE', slotDurationMinute: 60, dayOfWeek: 2, startTime: ruleTime(8), endTime: ruleTime(10) };
  const post = (body) => api('POST', `/catalog/rules/services/${id}`, { token: providerToken, body });
  assert.equal((await post({ ...base, endTime: ruleTime(8) })).code, 1017);
  assert.equal((await post({ ...base, slotDurationMinute: 0 })).code, 1027);
  assert.equal((await post({ ...base, dayOfWeek: 9 })).code, 1028);
});

test('slots are sorted by startedAt and honour from/to', async () => {
  const id = await createService('ONSITE', `E2E Window ${ts}`);
  const day = tomorrowVn();
  const rule = { status: 'ACTIVE', slotDurationMinute: 60, dayOfWeek: day.dayOfWeek, startTime: ruleTime(8), endTime: ruleTime(12) };
  assert.equal((await api('POST', `/catalog/rules/services/${id}`, { token: providerToken, body: rule })).code, 1000);

  const all = await slotsOf(id);
  const starts = all.map((s) => Date.parse(s.startedAt));
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));

  const inWindow = await slotsOf(id, { from: day.from, to: day.to });
  assert.equal(inWindow.length, 4);
  const [from, to] = [Date.parse(day.from), Date.parse(day.to)];
  assert.ok(inWindow.every((s) => Date.parse(s.startedAt) >= from && Date.parse(s.startedAt) <= to));
});

test('category writes are admin-only', async () => {
  const body = { name: `E2E ${ts}`, slug: `e2e-${ts}`, description: 'E2E' };
  const denied = await api('POST', '/catalog/categories', { token: providerToken, body });
  assert.equal(denied.code, 1007);

  const ok = await api('POST', '/catalog/categories', { token: adminToken, body });
  assert.equal(ok.code, 1000);
  const id = ok.result.categoryId;
  assert.ok(id);
  const removed = await api('DELETE', `/catalog/categories/${id}`, { token: adminToken });
  assert.equal(removed.code, 1000);
});
