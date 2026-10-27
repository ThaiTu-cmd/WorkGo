/**
 * mockBookingSlots.js: Store mock cho Đặt lịch hẹn và Giữ chỗ chuyên gia (Booking Slots).
 * Thay thế hoàn toàn BookingSlotController backend, hỗ trợ AVAILABLE -> HELD -> BOOKED.
 */

const STORAGE_KEY = 'workgo_booking_slots';

export const MOCK_SERVICES = [
  { id: 'srv-1', title: 'Thiết kế nhận diện thương hiệu doanh nghiệp', provider: 'DesignPro Studio' },
  { id: 'srv-2', title: 'Phát triển Web Fullstack React & Node.js', provider: 'TechCraft Team' },
  { id: 'srv-3', title: 'Tư vấn chiến lược SEO & Performance Marketing', provider: 'GrowthMax Agency' },
];

const SEED_SLOTS = [
  {
    id: 'slot-101',
    serviceId: 'srv-1',
    date: '2026-10-21',
    startTime: '09:00',
    endTime: '10:30',
    status: 'AVAILABLE',
    holdExpiresAt: null,
  },
  {
    id: 'slot-102',
    serviceId: 'srv-1',
    date: '2026-10-21',
    startTime: '14:00',
    endTime: '15:30',
    status: 'HELD',
    holdExpiresAt: Date.now() + 25 * 60 * 1000, // còn 25 phút
  },
  {
    id: 'slot-103',
    serviceId: 'srv-1',
    date: '2026-10-22',
    startTime: '10:00',
    endTime: '11:30',
    status: 'BOOKED',
    holdExpiresAt: null,
  },
  {
    id: 'slot-201',
    serviceId: 'srv-2',
    date: '2026-10-21',
    startTime: '13:30',
    endTime: '15:00',
    status: 'AVAILABLE',
    holdExpiresAt: null,
  },
  {
    id: 'slot-202',
    serviceId: 'srv-2',
    date: '2026-10-22',
    startTime: '15:30',
    endTime: '17:00',
    status: 'AVAILABLE',
    holdExpiresAt: null,
  },
  {
    id: 'slot-301',
    serviceId: 'srv-3',
    date: '2026-10-23',
    startTime: '09:30',
    endTime: '11:00',
    status: 'AVAILABLE',
    holdExpiresAt: null,
  },
];

function notifySlotChange() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('workgo-slots-changed'));
    } catch (e) {
      // Ignore
    }
  }
}

export function cleanExpiredHolds(slots) {
  const now = Date.now();
  let modified = false;

  const cleaned = (slots || []).map((s) => {
    if (s.status === 'HELD' && s.holdExpiresAt && s.holdExpiresAt < now) {
      modified = true;
      return {
        ...s,
        status: 'AVAILABLE',
        holdExpiresAt: null,
      };
    }
    return s;
  });

  return { cleaned, modified };
}

export function getSlots(serviceId = null) {
  if (typeof window === 'undefined') {
    const list = SEED_SLOTS;
    return serviceId ? list.filter((s) => s.serviceId === serviceId) : list;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let slots = raw ? JSON.parse(raw) : SEED_SLOTS;

    // Tự động kiểm tra và giải phóng slot HELD đã quá hạn
    const { cleaned, modified } = cleanExpiredHolds(slots);
    if (modified || !raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      slots = cleaned;
    }

    return serviceId ? slots.filter((s) => s.serviceId === serviceId) : slots;
  } catch (_err) {
    return SEED_SLOTS;
  }
}

export function holdSlot(slotId, durationMinutes = 30) {
  if (typeof window === 'undefined') return null;

  try {
    const allSlots = getSlots();
    const target = allSlots.find((s) => s.id === slotId);

    if (!target) return null;
    if (target.status !== 'AVAILABLE') {
      return null; // Không thể giữ chỗ nếu không AVAILABLE
    }

    target.status = 'HELD';
    target.holdExpiresAt = Date.now() + durationMinutes * 60 * 1000;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSlots));
    notifySlotChange();
    return target;
  } catch (_err) {
    return null;
  }
}

export function confirmSlot(slotId) {
  if (typeof window === 'undefined') return null;

  try {
    const allSlots = getSlots();
    const target = allSlots.find((s) => s.id === slotId);

    if (!target) return null;
    if (target.status !== 'HELD') {
      return null;
    }

    target.status = 'BOOKED';
    target.holdExpiresAt = null;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSlots));
    notifySlotChange();
    return target;
  } catch (_err) {
    return null;
  }
}

export function releaseSlot(slotId) {
  if (typeof window === 'undefined') return false;

  try {
    const allSlots = getSlots();
    const target = allSlots.find((s) => s.id === slotId);

    if (!target) return false;
    if (target.status !== 'HELD') {
      return false;
    }

    target.status = 'AVAILABLE';
    target.holdExpiresAt = null;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSlots));
    notifySlotChange();
    return true;
  } catch (_err) {
    return false;
  }
}
