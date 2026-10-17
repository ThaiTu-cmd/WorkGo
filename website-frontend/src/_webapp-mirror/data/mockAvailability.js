// Day numbering used by catalog-service rules: 2 = Thứ 2 … 7 = Thứ 7, 8 = Chủ nhật
// (matches the seed rows in catalog-service data.sql). Change here if the backend changes.
export const WEEK_DAYS = [
  { value: 2, label: 'Thứ 2', short: 'T2' },
  { value: 3, label: 'Thứ 3', short: 'T3' },
  { value: 4, label: 'Thứ 4', short: 'T4' },
  { value: 5, label: 'Thứ 5', short: 'T5' },
  { value: 6, label: 'Thứ 6', short: 'T6' },
  { value: 7, label: 'Thứ 7', short: 'T7' },
  { value: 8, label: 'Chủ nhật', short: 'CN' },
];

// Seeded services that exist in catalog_db; used when /services/my-services
// is not available for the signed-in account.
export const SEED_SERVICE_IDS = [
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  '66666666-6666-6666-6666-666666666666',
];

export const mockAvailabilityServices = [
  { serviceId: 'mock-svc-1', title: 'Tư vấn thiết kế UI/UX 1:1 (Online)' },
  { serviceId: 'mock-svc-2', title: 'Sửa chữa điện nước tại nhà' },
];

export const mockRules = {
  'mock-svc-1': [
    { id: 'm-1', dayOfWeek: 2, start: '08:00', end: '12:00', slotDurationMinute: 60, status: 'ACTIVE' },
    { id: 'm-2', dayOfWeek: 2, start: '14:00', end: '17:00', slotDurationMinute: 60, status: 'ACTIVE' },
    { id: 'm-3', dayOfWeek: 4, start: '09:00', end: '11:30', slotDurationMinute: 30, status: 'ACTIVE' },
    { id: 'm-4', dayOfWeek: 6, start: '18:00', end: '21:00', slotDurationMinute: 90, status: 'INACTIVE' },
  ],
  'mock-svc-2': [
    { id: 'm-5', dayOfWeek: 7, start: '08:00', end: '16:00', slotDurationMinute: 120, status: 'ACTIVE' },
    { id: 'm-6', dayOfWeek: 8, start: '08:00', end: '12:00', slotDurationMinute: 120, status: 'ACTIVE' },
  ],
};

const day = (offset, h, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const mockSlots = {
  'mock-svc-1': [
    { bookingSlotId: 's-1', startedAt: day(1, 8), endAt: day(1, 9), status: 'BOOKED' },
    { bookingSlotId: 's-2', startedAt: day(1, 9), endAt: day(1, 10), status: 'HELD' },
    { bookingSlotId: 's-3', startedAt: day(1, 10), endAt: day(1, 11), status: 'AVAILABLE' },
    { bookingSlotId: 's-4', startedAt: day(3, 9), endAt: day(3, 9, 30), status: 'AVAILABLE' },
    { bookingSlotId: 's-5', startedAt: day(3, 9, 30), endAt: day(3, 10), status: 'BOOKED' },
  ],
  'mock-svc-2': [
    { bookingSlotId: 's-6', startedAt: day(2, 8), endAt: day(2, 10), status: 'AVAILABLE' },
  ],
};
