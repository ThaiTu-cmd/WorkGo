import test from 'node:test';
import assert from 'node:assert/strict';
import { adminApi } from '../src/marketplace/api/adminApi.js';
import axiosClient from '../src/marketplace/api/axiosClient.js';
import { canAccessAdminPath } from '../src/components/admin/adminPolicy.js';
import { disputeDecisionBody, moderationActions, moderationDetailVisible } from '../src/components/admin/moderationPolicy.js';
import { adminUserDraftValid, adminUserUpdate } from '../src/components/admin/adminUserUpdate.js';

const token = roles => `x.${Buffer.from(JSON.stringify({ scope: roles.map(role => `ROLE_${role}`).join(' ') })).toString('base64url')}.x`;

test('SUPER_ADMIN can inspect Job but cannot open Trust moderation', () => {
  assert.equal(canAccessAdminPath(token(['SUPER_ADMIN']), 'jobs'), true);
  assert.equal(canAccessAdminPath(token(['SUPER_ADMIN']), 'disputes'), false);
  assert.equal(canAccessAdminPath(token(['ADMIN']), 'jobs'), true);
});

test('moderation actions follow role, case ownership and decision state', () => {
  assert.deepEqual(moderationActions('jobs', { moderationHidden: false }, ['SUPER_ADMIN'], 'admin-1'), []);
  assert.deepEqual(moderationActions('jobs', { moderationHidden: false }, ['ADMIN'], 'admin-1'), ['hide']);
  assert.deepEqual(moderationActions('disputes', { status: 'OPEN' }, ['ADMIN'], 'admin-1'), ['takeOver']);
  assert.deepEqual(moderationActions('disputes', { status: 'UNDER_REVIEW', assignedAdminId: 'admin-2' }, ['ADMIN'], 'admin-1'), []);
  assert.deepEqual(moderationActions('disputes', { status: 'UNDER_REVIEW', assignedAdminId: 'admin-1' }, ['ADMIN'], 'admin-1'), ['requestEvidence', 'resolve']);
  assert.deepEqual(moderationActions('disputes', { status: 'UNDER_REVIEW', assignedAdminId: 'admin-1', decisionId: 'decision-1', decision: { executionStatus: 'NEEDS_RECONCILIATION', terminalConflict: false } }, ['ADMIN'], 'admin-1'), ['retry']);
  assert.deepEqual(moderationActions('disputes', { status: 'RESOLVED', assignedAdminId: 'admin-1', decisionId: 'decision-1', decision: { executionStatus: 'NEEDS_RECONCILIATION', terminalConflict: false } }, ['ADMIN'], 'admin-1'), []);
  assert.deepEqual(moderationActions('disputes', { status: 'UNDER_REVIEW', assignedAdminId: 'admin-1', decisionId: 'decision-1', decision: { executionStatus: 'NEEDS_RECONCILIATION', terminalConflict: true } }, ['ADMIN'], 'admin-1'), []);
});

test('a detail loaded for a previous admin is hidden after account change', () => {
  assert.equal(moderationDetailVisible({ id: 'case-1', userId: 'admin-a' }, 'case-1', 'admin-b'), false);
  assert.equal(moderationDetailVisible({ id: 'case-1', userId: 'admin-a' }, 'case-1', 'admin-a'), true);
});

test('dispute decision payload follows the backend fault and correction rules', () => {
  const base = { reason: 'checked', evidenceSummary: 'files', expectedVersion: 3, operation: 'REFUND', branch: 'PROVIDER' };
  assert.deepEqual(disputeDecisionBody({ ...base, faultType: 'ABANDONMENT' }), { ...base, faultType: 'ABANDONMENT', lateCycles: 0 });
  assert.equal(disputeDecisionBody({ ...base, branch: 'CLIENT', faultType: 'ABANDONMENT' }), null);
  assert.deepEqual(disputeDecisionBody({ ...base, faultType: 'LATE', lateCycles: 2 }), { ...base, faultType: 'LATE', lateCycles: 2 });
  assert.equal(disputeDecisionBody({ ...base, faultType: 'LATE', lateCycles: 0 }), null);
  const previous = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(disputeDecisionBody({ ...base, operation: 'REJECT', faultType: 'CORRECTION', supersedesDecisionId: previous }), { ...base, operation: 'REJECT', branch: 'NONE', faultType: 'CORRECTION', lateCycles: 0, supersedesDecisionId: previous });
  assert.equal(disputeDecisionBody({ ...base, operation: 'REJECT', faultType: 'CORRECTION', supersedesDecisionId: 'bad' }), null);
});

test('account edits send only changed profile fields with reason and version', () => {
  const user = { firstName: 'An', lastName: 'Tran', email: 'old@example.test', phone: '0123456789', version: 6, roles: ['CLIENT'] };
  const draft = { firstName: 'An', lastName: 'Tran', email: 'new@example.test', phone: '0123456789' };
  assert.deepEqual(adminUserUpdate(user, draft, ' Corrected email '), { email: 'new@example.test', reason: 'Corrected email', version: 6 });
  assert.equal(adminUserUpdate(user, { ...draft, email: user.email }, 'No change'), null);
  assert.equal(adminUserDraftValid(draft), true);
  assert.equal(adminUserDraftValid({ ...draft, email: 'invalid' }), false);
  assert.equal(adminUserDraftValid({ ...draft, phone: '123' }), false);
});

test('ADMIN queues use the Spring page content and preserve pagination', async (t) => {
  const calls = [];
  t.mock.method(axiosClient, 'get', async (path, options) => {
    calls.push([path, options]);
    return { result: { content: [{ jobId: 'job-1' }], number: 2, totalElements: 31, totalPages: 4 } };
  });

  const jobs = await adminApi.listModerationJobs(2);
  const disputes = await adminApi.listModerationDisputes(2);
  const history = await adminApi.getModerationJobHistory('job-1', 2);
  assert.deepEqual(jobs.result, { data: [{ jobId: 'job-1' }], currentPage: 2, totalElements: 31, totalPages: 4 });
  assert.deepEqual(disputes.result, jobs.result);
  assert.deepEqual(history.result, jobs.result);
  assert.deepEqual(calls, [
    ['/job/admin/jobs', { params: { page: 2 } }],
    ['/trust/admin/disputes', { params: { page: 2 } }],
    ['/job/admin/jobs/job-1/history', { params: { page: 2 } }],
  ]);
});

test('ADMIN moderation sends version and reason to owning services', async (t) => {
  const calls = [];
  t.mock.method(axiosClient, 'put', async (path, body) => { calls.push(['PUT', path, body]); return { result: body }; });
  t.mock.method(axiosClient, 'post', async (path, body) => { calls.push(['POST', path, body]); return { result: body }; });
  const reason = 'Verified evidence';
  await adminApi.moderateJob('job-1', { hidden: true, reason, expectedVersion: 4 });
  await adminApi.moderateReview('review-1', { status: 'HIDDEN', reason, expectedVersion: 5 });
  await adminApi.updateReport('report-1', { status: 'RESOLVED', reason, expectedVersion: 6 });
  await adminApi.takeOverDispute('dispute-1', { reason, expectedVersion: 7 });
  await adminApi.requestDisputeEvidence('dispute-1', { reason, expectedVersion: 8 });
  await adminApi.resolveDispute('dispute-1', { operation: 'REFUND', branch: 'CLIENT', reason, evidenceSummary: reason, expectedVersion: 9 });
  await adminApi.retryDecision('decision-1', { reason, expectedVersion: 10 });
  assert.deepEqual(calls, [
    ['PUT', '/job/admin/jobs/job-1/moderation', { hidden: true, reason, expectedVersion: 4 }],
    ['PUT', '/trust/admin/reviews/review-1/moderation', { status: 'HIDDEN', reason, expectedVersion: 5 }],
    ['PUT', '/trust/admin/reports/report-1/status', { status: 'RESOLVED', reason, expectedVersion: 6 }],
    ['POST', '/trust/admin/disputes/dispute-1/take-over', { reason, expectedVersion: 7 }],
    ['POST', '/trust/admin/disputes/dispute-1/evidence-request', { reason, expectedVersion: 8 }],
    ['POST', '/trust/admin/disputes/dispute-1/resolve', { operation: 'REFUND', branch: 'CLIENT', reason, evidenceSummary: reason, expectedVersion: 9 }],
    ['POST', '/trust/admin/decisions/decision-1/retry', { reason, expectedVersion: 10 }],
  ]);
});

test('ADMIN evidence download stays on the Trust Gateway route', async (t) => {
  const calls = [];
  const link = '/api/v1/trust/evidence/file-1/content?expires=100&signature=signed';
  t.mock.method(axiosClient, 'get', async (path, options) => {
    calls.push([path, options]);
    if (path.endsWith('/download-url')) return { result: { url: link } };
    if (options?.responseType === 'blob') return new Blob(['proof']);
    return { result: [{ id: 'file-1', mimeType: 'image/png' }] };
  });
  assert.equal((await adminApi.listDisputeEvidence('dispute-1')).result[0].id, 'file-1');
  assert.equal(await (await adminApi.downloadDisputeEvidence('file-1')).text(), 'proof');
  assert.deepEqual(calls, [
    ['/trust/disputes/dispute-1/evidence', undefined],
    ['/trust/evidence/file-1/download-url', undefined],
    ['/trust/evidence/file-1/content?expires=100&signature=signed', { responseType: 'blob' }],
  ]);
});
