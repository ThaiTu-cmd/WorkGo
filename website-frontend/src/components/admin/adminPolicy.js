import { hasRole } from '../../_webapp-mirror/utils/jwt.js';

export function canAccessAdminPath(token, path = '') {
  const section = path.split('/')[0];
  if (!section || section === 'audit') return hasRole(token, 'ADMIN') || hasRole(token, 'SUPER_ADMIN');
  const role = ['jobs', 'reviews', 'reports', 'disputes', 'cases', 'payouts', 'reconciliation'].includes(section) ? 'ADMIN'
    : ['users', 'providers', 'verifications', 'categories', 'escrow', 'fees', 'sanctions', 'score-reviews', 'monitoring'].includes(section) ? 'SUPER_ADMIN' : null;
  return role !== null && hasRole(token, role);
}
