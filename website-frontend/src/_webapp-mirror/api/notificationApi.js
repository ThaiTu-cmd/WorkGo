import axiosClient from './axiosClient.js';

// communication-service notification endpoints via gateway (/api/v1/communication/**).
export const notificationApi = {
  listNotifications: ({ unreadOnly = false, page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    axiosClient.get('/communication/notifications', {
      params: { unreadOnly, page, size, sort },
    }),

  markRead: (notificationId) =>
    axiosClient.post(`/communication/notifications/${notificationId}/read`),

  readAll: () =>
    axiosClient.post('/communication/notifications/read-all'),
};

export default notificationApi;
