import axiosClient from './axiosClient.js';

export const isUnread = (item) => !item.readAt;
export function notificationTarget(item) {
  if (!item.referenceId) return null;
  switch (item.referenceType) {
    case 'ORDER': return { page: 'orders', params: { orderId: item.referenceId } };
    case 'SERVICE': return { page: 'detail', params: { serviceId: item.referenceId } };
    default: return null;
  }
}

// communication-service notification endpoints via gateway (/api/v1/communication/**).
export const notificationApi = {
  getInbox: async () => {
    const [list, unread] = await Promise.all([
      notificationApi.listNotifications({ size: 15 }),
      notificationApi.listNotifications({ unreadOnly: true, size: 1 }),
    ]);
    return { items: list?.result?.data ?? [], unreadCount: unread?.result?.totalElements ?? 0 };
  },
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
