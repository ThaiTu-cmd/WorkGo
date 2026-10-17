import axiosClient from './axiosClient';

// catalog-service availability endpoints via gateway (/api/v1/catalog/**).
export const availabilityApi = {
  getMyServices: (page = 0, size = 50) =>
    axiosClient.get('/catalog/services/my-services', { params: { page, size } }),

  getService: (serviceId) => axiosClient.get(`/catalog/services/${serviceId}`),

  getRules: (serviceId, page = 0, size = 100) =>
    axiosClient.get(`/catalog/rules/services/${serviceId}`, { params: { page, size } }),

  createRule: (serviceId, body) => axiosClient.post(`/catalog/rules/services/${serviceId}`, body),

  updateRule: (ruleId, body) => axiosClient.put(`/catalog/rules/${ruleId}`, body),

  deleteRule: (ruleId) => axiosClient.delete(`/catalog/rules/${ruleId}`),

  getSlots: (serviceId, page = 0, size = 50) =>
    axiosClient.get(`/catalog/slots/services/${serviceId}`, { params: { page, size } }),
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

export default availabilityApi;
