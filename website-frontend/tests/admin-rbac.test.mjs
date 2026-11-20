import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../src/components/admin/adminPolicy.js';
import { adminApi } from '../src/_webapp-mirror/api/adminApi.js';
import axiosClient from '../src/_webapp-mirror/api/axiosClient.js';
import { ApiError, setAccessToken } from '../src/_webapp-mirror/api/axiosClient.js';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const token = roles => `x.${Buffer.from(JSON.stringify({ scope: roles.map(r => `ROLE_${r}`).join(' ') })).toString('base64url')}.x`;

test('ADMIN cannot open account/fee/sanction routes by typing a URL', () => {
  for (const path of ['users', 'providers', 'verifications', 'categories', 'fees', 'sanctions', 'escrow']) assert.equal(policy.canAccessAdminPath(token(['ADMIN']), path), false, path);
  assert.equal(policy.canAccessAdminPath(token(['ADMIN']), 'disputes/case-1'), true);
});
test('SUPER_ADMIN alone cannot resolve moderation/dispute cases', () => {
  assert.equal(policy.canAccessAdminPath(token(['SUPER_ADMIN']), 'users'), true);
  for (const path of ['jobs', 'reports', 'reviews', 'disputes/1', 'cases/1']) assert.equal(policy.canAccessAdminPath(token(['SUPER_ADMIN']), path), false, path);
});
test('combined roles get the union; unknown routes and guests are denied', () => {
  assert.equal(policy.canAccessAdminPath(token(['ADMIN', 'SUPER_ADMIN']), 'users'), true);
  assert.equal(policy.canAccessAdminPath(token(['ADMIN', 'SUPER_ADMIN']), 'cases/1'), true);
  assert.equal(policy.canAccessAdminPath(null, ''), false);
  assert.equal(policy.canAccessAdminPath(token(['CLIENT']), ''), false);
  assert.equal(policy.canAccessAdminPath(token(['ADMIN']), 'unknown'), false);
});

test('admin financial and monitoring routes honor their service roles', () => {
  for (const [role, section, allowed] of [
    ['ADMIN', 'payouts', true], ['ADMIN', 'reconciliation', true],
    ['ADMIN', 'monitoring', false], ['ADMIN', 'fees', false], ['ADMIN', 'audit', true],
    ['SUPER_ADMIN', 'payouts', false], ['SUPER_ADMIN', 'reconciliation', false],
    ['SUPER_ADMIN', 'monitoring', true], ['SUPER_ADMIN', 'fees', true], ['SUPER_ADMIN', 'audit', true],
  ]) assert.equal(policy.canAccessAdminPath(token([role]), section), allowed, `${role}/${section}`);
});

test('account admin mutations carry the explicit reason and current user version', async (t) => {
  const calls = [];
  t.mock.method(axiosClient, 'post', async (path, body) => calls.push(['POST', path, body]));
  t.mock.method(axiosClient, 'delete', async (path, options) => calls.push(['DELETE', path, options.data]));
  const payload = { reason: 'Approved by supervisor', version: 4 };
  await adminApi.grantUserRole('user-1', { ...payload, roleName: 'ADMIN' });
  await adminApi.revokeUserRole('user-1', { ...payload, roleName: 'ADMIN' });
  await adminApi.deleteUser('user-1', payload);
  assert.deepEqual(calls, [
    ['POST', '/identity/users/user-1/roles/grant', { ...payload, roleName: 'ADMIN' }],
    ['POST', '/identity/users/user-1/roles/revoke', { ...payload, roleName: 'ADMIN' }],
    ['DELETE', '/identity/users/user-1', payload],
  ]);
});

test('Payment reconciliation uses the case identifier expected by each endpoint and supplies evidence', async (t) => {
  const calls = [];
  t.mock.method(axiosClient, 'post', async (path, body) => calls.push([path, body]));
  const proof = { reason: 'Payment verified by bank', externalReference: 'bank-trace-1' };
  await adminApi.resolveTopUp('top-up-1', { ...proof, result: 'SUCCEEDED' });
  await adminApi.retryOrderSync('order-1', { reason: 'Order service healthy' });
  await adminApi.markPayout('payout-1', 'paid', proof);
  assert.deepEqual(calls, [
    ['/payment/admin/reconciliation/top-ups/top-up-1/resolve', { ...proof, result: 'SUCCEEDED' }],
    ['/payment/admin/reconciliation/orders/order-1/retry-order-sync', { reason: 'Order service healthy' }],
    ['/payment/admin/payouts/payout-1/paid', proof],
  ]);
});

test('verification document downloads stay on the authenticated Identity Gateway route', async (t) => {
  const link = '/provider-verifications/documents/document-1/content?expires=100&signature=signed';
  const calls = [];
  t.mock.method(axiosClient, 'get', async (path, options) => {
    calls.push([path, options]);
    if (!options) return { result: { url: link } };
    return new Blob(['document']);
  });
  assert.equal(await (await adminApi.downloadVerificationDocument('verification-1', 'document-1')).text(), 'document');
  assert.deepEqual(calls, [
    ['/identity/provider-verifications/verification-1/documents/document-1/download-url', undefined],
    ['/identity' + link, { responseType: 'blob' }],
  ]);
  t.mock.method(axiosClient, 'get', async () => ({ result: { url: 'https://wrong.invalid' + link } }));
  await assert.rejects(() => adminApi.downloadVerificationDocument('verification-1', 'document-1'));
});

test('audit export sends the selected source and date range to the audited route', async (t) => {
  const calls = [];
  const params = { from: '2026-11-01T00:00:00.000Z', to: '2026-11-15T00:00:00.000Z', action: 'USER_DISABLED' };
  t.mock.method(axiosClient, 'get', async (path, options) => {
    calls.push([path, options]);
    return new Blob(['createdAt,actorId,action']);
  });
  await adminApi.exportAuditLogs('identity', params);
  assert.deepEqual(calls, [['/identity/admin/audit-logs/export', { params, responseType: 'blob' }]]);
});

test('an invalid old token cannot replay an account role mutation through refresh', async (t) => {
  const values = new Map([['accessToken', 'old-admin-token']]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  t.after(() => { delete globalThis.localStorage; });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url, options.method]);
    return Response.json({ code: 1401, message: 'Unauthenticated' }, { status: url.endsWith('/refresh') ? 400 : 401 });
  });
  await assert.rejects(adminApi.grantUserRole('user-1', { roleName: 'ADMIN', reason: 'Assigned', version: 2 }), (error) => error.status === 401);
  assert.deepEqual(calls, [
    ['/api/v1/identity/users/user-1/roles/grant', 'POST'],
    ['/api/v1/identity/auth/refresh', 'POST'],
  ]);
  assert.equal(values.has('accessToken'), false);
  setAccessToken(null);
});

test('forbidden and stale-account failures keep the session and send each admin mutation once', async (t) => {
  globalThis.localStorage = { getItem: () => 'admin-token' };
  t.after(() => { delete globalThis.localStorage; });
  for (const [status, code] of [[403, 1034], [409, 1033]]) {
    const calls = [];
    const mocked = t.mock.method(globalThis, 'fetch', async (url) => {
      calls.push(url);
      return Response.json({ code, message: 'Denied' }, { status });
    });
    await assert.rejects(adminApi.revokeUserRole('user-1', { roleName: 'ADMIN', reason: 'Revoked', version: 2 }), (error) => error.status === status && error.code === code);
    assert.deepEqual(calls, ['/api/v1/identity/users/user-1/roles/revoke']);
    mocked.mock.restore();
  }
});

test('shared admin feedback and confirmation controls render in English', () => {
  const { ListState, Pagination, ConfirmDialog, StatusBadge } = loadAdminUi('en');
  const html = (component, props) => renderToStaticMarkup(React.createElement(component, props));
  assert.match(html(ListState, { loading: true, empty: true, error: null }), /Loading/);
  assert.match(html(ListState, { loading: false, empty: true, error: null }), /No data/);
  assert.match(html(ListState, { loading: false, empty: false, error: 'Unavailable', onRetry: () => {} }), /Try again/);
  assert.match(html(Pagination, { page: 0, totalPages: 2, totalElements: 20, onChange: () => {} }), /Page 1\/2/);
  assert.match(html(ConfirmDialog, { title: 'Change role', body: 'Reason', confirmLabel: 'Confirm', onConfirm: () => {}, onCancel: () => {} }), /Cancel/);
  assert.match(html(StatusBadge, { status: 'PENDING' }), /Pending/);
});

function loadAdminUi(locale) {
  const require = createRequire(import.meta.url);
  const dictionary = JSON.parse(fs.readFileSync(new URL('../src/dictionaries/' + locale + '.json', import.meta.url), 'utf8')).adminOperations;
  const source = fs.readFileSync(new URL('../src/components/admin/ui.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  const mockedRequire = (name) => {
    if (name === 'next-intl') return {
      useLocale: () => locale,
      useTranslations: () => (key, params = {}) => dictionary[key]?.replace(/\{(\w+)\}/g, (_, name) => params[name]) ?? key,
    };
    if (name === '@/components/webapp-bridge/backend') return { ApiError };
    if (name.endsWith('.css')) return { default: {} };
    return require(name);
  };
  vm.runInNewContext(compiled, { exports, require: mockedRequire, window: {}, document: {} });
  return exports;
}
