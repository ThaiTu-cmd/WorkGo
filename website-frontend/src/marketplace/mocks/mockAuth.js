/**
 * mockAuth.js: Tiện ích quản lý thông tin phiên người dùng mock cho Backend Parity.
 * SSR-safe, đồng bộ với workgo_auth_user và accessToken của toàn hệ thống, không gọi backend API.
 */

const STORAGE_KEY = 'workgo_current_user';

export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      if (raw === 'null' || raw === 'guest' || raw === 'logged_out') {
        return null;
      }
      return JSON.parse(raw);
    }
    const authUserRaw = localStorage.getItem('workgo_auth_user');
    if (authUserRaw) {
      const parsed = JSON.parse(authUserRaw);
      if (parsed && typeof parsed === 'object') {
        const email = parsed.email || '';
        return {
          id: parsed.id || 'usr_auth_01',
          name: parsed.name || 'Người dùng WorkGo',
          email: email,
          role: email.includes('admin') ? 'ADMIN' : 'PROVIDER',
        };
      }
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      return {
        id: 'usr_demo_01',
        name: 'Nguyễn Văn Chuyên Gia',
        email: 'provider.demo@workgo.vn',
        role: 'PROVIDER',
      };
    }
    return null;
  } catch (_err) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (_err) {
    // quota safe
  }
}
