import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../src/components/admin/adminPolicy.js';
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
