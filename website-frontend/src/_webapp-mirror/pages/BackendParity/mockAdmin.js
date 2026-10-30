/**
 * mockAdmin.js: Store mock cho Bảng điều khiển Quản trị viên (Admin Console).
 * Không kết nối backend, bảo đảm SSR-safe và lưu trữ localStorage.
 */

const STORAGE_KEY = 'workgo_admin_users';

const SEED_USERS = [
  {
    id: 'usr_admin_01',
    name: 'Quản Trị Viên WorkGo',
    email: 'admin@workgo.vn',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'usr_demo_01',
    name: 'Nguyễn Văn Chuyên Gia',
    email: 'provider.demo@workgo.vn',
    role: 'PROVIDER',
    status: 'ACTIVE',
    joinedAt: '2026-02-15T09:30:00.000Z',
  },
  {
    id: 'usr_demo_02',
    name: 'Lê Thị Thu Khách',
    email: 'client.demo@workgo.vn',
    role: 'CLIENT',
    status: 'ACTIVE',
    joinedAt: '2026-03-20T14:15:00.000Z',
  },
  {
    id: 'usr_demo_03',
    name: 'Trần Minh Designer',
    email: 'minh.design@workgo.vn',
    role: 'PROVIDER',
    status: 'ACTIVE',
    joinedAt: '2026-04-05T11:45:00.000Z',
  },
  {
    id: 'usr_demo_04',
    name: 'Phạm Hoàng Khách Hàng',
    email: 'hoang.buyer@workgo.vn',
    role: 'CLIENT',
    status: 'SUSPENDED',
    joinedAt: '2026-05-12T16:20:00.000Z',
  },
];

export function getAdminUsers() {
  if (typeof window === 'undefined') {
    return SEED_USERS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(raw);
  } catch (_err) {
    return SEED_USERS;
  }
}

export function updateUserStatus(userId, newStatus) {
  if (typeof window === 'undefined') return null;
  try {
    const users = getAdminUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) return null;

    target.status = newStatus;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return target;
  } catch (_err) {
    return null;
  }
}
