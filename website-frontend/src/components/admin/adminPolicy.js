import { hasRole } from '../../_webapp-mirror/utils/jwt.js';

export function canAccessAdminPath(token, path = '') {
  const section = path.split('/')[0];
  if (!section) return hasRole(token, 'ADMIN') || hasRole(token, 'SUPER_ADMIN');
  const role = ['jobs', 'reviews', 'reports', 'disputes', 'cases'].includes(section) ? 'ADMIN'
    : ['users', 'providers', 'verifications', 'categories', 'escrow', 'fees', 'sanctions', 'monitoring', 'audit', 'reconciliation'].includes(section) ? 'SUPER_ADMIN' : null;
  return role !== null && hasRole(token, role);
}
