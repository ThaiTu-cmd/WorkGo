// catalog-service hardening: internal-key check, no public slot hold/confirm/
// release, one winner per slot, rules cleaned up with their service, rules
// that end at midnight.
// Needs the backend (gateway + identity + catalog), the Postgres containers and
// INTERNAL_API_KEY (read from the environment or the repository's .env).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8888/api/v1';
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:8082/catalog';
const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const ts = Date.now().toString(36);

function internalKey() {
  if (process.env.INTERNAL_API_KEY) return process.env.INTERNAL_API_KEY;
  const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
  const line = readFileSync(envFile, 'utf-8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('INTERNAL_API_KEY='));
  return line ? line.slice('INTERNAL_API_KEY='.length).trim() : '';
}
const KEY = internalKey();

let providerToken = '';
let categoryId = '';
const created = { services: [] };

function queryCatalogDb(sql) {
  const cmd = `docker exec catalog-postgres psql -U postgres -d catalog_db -t -A -c "${sql.replace(/"/g, '\\"')}"`;
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

async function call(base, method, path, { token, key, body, params } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const res = await fetch(`${base}${path}${query}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(key && { 'X-Internal-Key': key }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, code: json?.code, result: json?.result, json };
}
const api = (method, path, opts) => call(GATEWAY_URL, method, path, opts);
const internal = (method, path, opts) => call(CATALOG_URL, method, path, opts);

async function login(userName, password) {
  const res = await api('POST', '/identity/auth/token', { body: { userName, password } });
  assert.ok(res.result?.token, `login failed for ${userName}`);
  return res.result.token;
}

async function createService(title) {
  const res = await api('POST', '/catalog/services', {
    token: providerToken,
    body: { categoryId, executionType: 'ONSITE', title, slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${ts}`, description: 'E2E', basePrice: 100000, currency: 'VND' },
  });
  assert.equal(res.code, 1000, `create service failed: ${res.code}`);
  created.services.push(res.result.serviceId);
  return res.result.serviceId;
}

// Tomorrow in UTC+7 as the catalog day-of-week (2 = Monday … 8 = Sunday) and its [00:00, 24:00) window.
function tomorrowVn() {
  const vnNow = new Date(Date.now() + VN_OFFSET_MS);
  const day = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + 1));
  const jsDay = day.getUTCDay();
  const from = new Date(day.getTime() - VN_OFFSET_MS);
  return { dayOfWeek: jsDay === 0 ? 8 : jsDay + 1, from: from.toISOString(), to: new Date(from.getTime() + DAY_MS - 1).toISOString() };
}
const ruleTime = (hour) => new Date(Date.UTC(1970, 0, 1, hour) - VN_OFFSET_MS).toISOString();

async function addRule(serviceId, startHour, endHour) {
  const day = tomorrowVn();
  const res = await api('POST', `/catalog/rules/services/${serviceId}`, {
    token: providerToken,
    body: { status: 'ACTIVE', slotDurationMinute: 60, dayOfWeek: day.dayOfWeek, startTime: ruleTime(startHour), endTime: ruleTime(endHour) },
  });
  assert.equal(res.code, 1000, `create rule failed: ${res.code}`);
  return { ruleId: res.result.availableRuleId, day };
}

async function slotsOf(serviceId, window) {
  const res = await api('GET', `/catalog/slots/services/${serviceId}`, { params: { page: 0, size: 100, ...window } });
  assert.equal(res.code, 1000);
  return res.result.data;
}

test.before(async () => {
  assert.ok(KEY, 'INTERNAL_API_KEY is not set');
  providerToken = await login('nguyenvana', 'Provider@123');
  const roots = await api('GET', '/catalog/categories/roots', { params: { page: 0, size: 50 } });
  categoryId = roots.result?.data?.[0]?.categoryId;
  assert.ok(categoryId, 'no root category');
});

test.after(async () => {
  for (const id of created.services) {
    try {
      queryCatalogDb(`DELETE FROM booking_slots WHERE service_id = '${id}'`);
    } catch {
      // best effort
    }
    await api('DELETE', `/catalog/services/${id}`, { token: providerToken });
  }
});

test('internal endpoints reject a call without the internal key', async () => {
  const services = await api('GET', '/catalog/services', { params: { page: 0, size: 1 } });
  const id = services.result.data[0].serviceId;
  const direct = await internal('GET', `/internal/services/${id}`);
  assert.equal(direct.status, 401);
  assert.equal(direct.code, 1005);
  const wrongKey = await internal('GET', `/internal/services/${id}`, { key: 'not-the-key' });
  assert.equal(wrongKey.status, 401);
  const viaGateway = await api('GET', `/catalog/internal/services/${id}`, { token: providerToken });
  assert.equal(viaGateway.status, 401, 'a user token reached a catalog internal endpoint');
});

test('internal endpoints accept the internal key', async () => {
  const services = await api('GET', '/catalog/services', { params: { page: 0, size: 1 } });
  const id = services.result.data[0].serviceId;
  const res = await internal('GET', `/internal/services/${id}`, { key: KEY });
  assert.equal(res.status, 200);
  assert.equal(res.json?.serviceId, id);
});

test('a signed-in user cannot hold, confirm or release a slot through the public API', async () => {
  const id = await createService(`E2E Public Hold ${ts}`);
  const { day } = await addRule(id, 8, 9);
  const [slot] = await slotsOf(id, { from: day.from, to: day.to });
  const orderId = crypto.randomUUID();
  for (const action of ['hold', 'confirm', 'release']) {
    const res = await api('POST', `/catalog/slots/${slot.bookingSlotId}/${action}`, { token: providerToken, body: { orderId } });
    assert.notEqual(res.code, 1000, `public ${action} succeeded`);
  }
  const [after] = await slotsOf(id, { from: day.from, to: day.to });
  assert.equal(after.status, 'AVAILABLE');
});

test('only one of several simultaneous holds on a slot wins', async () => {
  const id = await createService(`E2E Race ${ts}`);
  const { day } = await addRule(id, 10, 11);
  const [slot] = await slotsOf(id, { from: day.from, to: day.to });
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      internal('POST', `/internal/slots/${slot.bookingSlotId}/hold`, { key: KEY, body: { orderId: crypto.randomUUID() } }),
    ),
  );
  const winners = attempts.filter((r) => r.status === 200 && r.json?.status === 'HELD');
  assert.equal(winners.length, 1, `holds that succeeded: ${winners.length}`);
});

test('deleting a service retires its rules and open slots', async () => {
  const id = await createService(`E2E Delete ${ts}`);
  const { ruleId } = await addRule(id, 13, 15);
  // the rule repeats weekly, so the 28-day window holds several open slots
  assert.ok(Number(queryCatalogDb(`SELECT count(*) FROM booking_slots WHERE service_id = '${id}' AND status = 'AVAILABLE'`)) > 0);
  const removed = await api('DELETE', `/catalog/services/${id}`, { token: providerToken });
  assert.equal(removed.code, 1000);
  assert.equal(queryCatalogDb(`SELECT count(*) FROM available_rules WHERE available_rule_id = '${ruleId}' AND is_deleted = 0`), '0');
  assert.equal(queryCatalogDb(`SELECT count(*) FROM booking_slots WHERE service_id = '${id}' AND status = 'AVAILABLE'`), '0');
  assert.notEqual(queryCatalogDb(`SELECT is_deleted FROM services WHERE service_id = '${id}'`), '0');
});

test('a rule that ends at midnight still makes slots', async () => {
  const id = await createService(`E2E Midnight ${ts}`);
  const { day } = await addRule(id, 20, 24);
  const slots = await slotsOf(id, { from: day.from, to: day.to });
  assert.equal(slots.length, 4);
});

test('a rule longer than a day is rejected', async () => {
  const id = await createService(`E2E Long ${ts}`);
  const day = tomorrowVn();
  const res = await api('POST', `/catalog/rules/services/${id}`, {
    token: providerToken,
    body: { status: 'ACTIVE', slotDurationMinute: 60, dayOfWeek: day.dayOfWeek, startTime: ruleTime(8), endTime: ruleTime(8 + 48) },
  });
  assert.equal(res.code, 1017);
});
