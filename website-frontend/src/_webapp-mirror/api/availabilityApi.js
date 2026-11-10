import axiosClient from './axiosClient.js';

// catalog-service availability endpoints via gateway (/api/v1/catalog/**).
export const availabilityApi = {
  getMyServices: (page = 0, size = 50) =>
    axiosClient.get('/catalog/services/my-services', { params: { page, size } }),

  getService: (serviceId) => axiosClient.get(`/catalog/services/${serviceId}`),

  getRules: (serviceId, page = 0, size = 100) =>
    axiosClient.get(`/catalog/rules/services/${serviceId}`, { params: { page, size } }),

  getRule: (ruleId) => axiosClient.get(`/catalog/rules/${ruleId}`),

  createRule: (serviceId, body) => axiosClient.post(`/catalog/rules/services/${serviceId}`, body),

  updateRule: (ruleId, body) => axiosClient.put(`/catalog/rules/${ruleId}`, body),

  deleteRule: (ruleId) => axiosClient.delete(`/catalog/rules/${ruleId}`),

  getSlots: (serviceId, page = 0, size = 50) =>
    axiosClient.get(`/catalog/slots/services/${serviceId}`, { params: { page, size } }),

  holdSlot: (slotId, orderId) =>
    axiosClient.post(`/catalog/slots/${slotId}/hold`, { orderId }),

  confirmSlot: (slotId, orderId) =>
    axiosClient.post(`/catalog/slots/${slotId}/confirm`, { orderId }),

  releaseSlot: (slotId, orderId) =>
    axiosClient.post(`/catalog/slots/${slotId}/release`, { orderId }),
};

// Rules store a time-of-day as an Instant on 1970-01-01, written in the
// provider's local zone (seed "08:00" comes back as 01:00Z in UTC+7).
export const instantToTime = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const timeToInstant = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(1970, 0, 1, h, m, 0).toISOString();
};

export const timeToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// catalog AvailableRule.dayOfWeek: 2 = Monday … 8 = Sunday.
export const WEEK_DAYS = [
  { value: 2, label: 'Thứ 2', short: 'T2' },
  { value: 3, label: 'Thứ 3', short: 'T3' },
  { value: 4, label: 'Thứ 4', short: 'T4' },
  { value: 5, label: 'Thứ 5', short: 'T5' },
  { value: 6, label: 'Thứ 6', short: 'T6' },
  { value: 7, label: 'Thứ 7', short: 'T7' },
  { value: 8, label: 'Chủ nhật', short: 'CN' },
  ];

export default availabilityApi;
