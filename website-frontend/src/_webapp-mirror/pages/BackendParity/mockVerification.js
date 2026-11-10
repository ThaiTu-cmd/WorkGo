/**
 * mockVerification.js: Store mock cho Trung tâm Xác thực Chuyên gia (Provider Verification).
 * Thay thế hoàn toàn ProviderVerificationController backend, không kết nối mạng.
 */

const STORAGE_KEY = 'workgo_provider_verifications';

const DEFAULT_VERIFICATIONS = [
  {
    id: 'VERIF-SEED-01',
    userId: 'usr_demo_01',
    userName: 'Nguyễn Văn Chuyên Gia',
    userEmail: 'provider.demo@workgo.vn',
    verificationType: 'IDENTITY',
    documentType: 'CCCD',
    documentNumber: '001095012345',
    documentUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    note: 'Hồ sơ xác thực căn cước công dân gắn chip.',
    status: 'VERIFIED',
    submittedAt: '2026-10-15T09:30:00.000Z',
    reviewedAt: '2026-10-16T14:20:00.000Z',
    reviewerNote: 'Giấy tờ hợp lệ, hình ảnh rõ nét.',
  },
];

function notifyChange() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('workgo-verification-changed'));
    } catch (e) {
      // Ignored in non-browser env
    }
  }
}

export function getVerifications() {
  if (typeof window === 'undefined') {
    return DEFAULT_VERIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VERIFICATIONS));
      return DEFAULT_VERIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (_err) {
    return DEFAULT_VERIFICATIONS;
  }
}

export function addVerification(payload) {
  const item = {
    id: `VERIF-${Date.now()}`,
    userId: payload.userId || 'usr_demo_01',
    userName: payload.userName || 'Nguyễn Văn Chuyên Gia',
    userEmail: payload.userEmail || 'provider.demo@workgo.vn',
    verificationType: payload.verificationType || 'IDENTITY',
    documentType: payload.documentType || 'CCCD',
    documentNumber: payload.documentNumber || '',
    documentUrl: payload.documentUrl || '',
    note: payload.note || '',
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerNote: '',
  };

  if (typeof window !== 'undefined') {
    try {
      const list = getVerifications();
      list.unshift(item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notifyChange();
    } catch (_err) {
      // quota safe
    }
  }

  return item;
}

export function reviewVerification(id, newStatus, reviewerNote = '') {
  if (typeof window === 'undefined') return null;
  try {
    const list = getVerifications();
    const target = list.find((v) => v.id === id);
    if (!target) return null;

    target.status = newStatus; // 'VERIFIED' | 'REJECTED'
    target.reviewedAt = new Date().toISOString();
    target.reviewerNote = reviewerNote;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyChange();
    return target;
  } catch (_err) {
    return null;
  }
}

export function removeVerification(id) {
  if (typeof window === 'undefined') return false;
  try {
    const list = getVerifications();
    const next = list.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyChange();
    return true;
  } catch (_err) {
    return false;
  }
}
