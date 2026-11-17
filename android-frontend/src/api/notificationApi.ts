import { http } from './client';
import type { ApiResponse, Paged } from './types';
export type NotificationDto = { id: string; title: string; content: string; readAt: string | null; createdAt: string; referenceType: string; referenceId: string | null };
export const notificationApi = {
  list: (page = 0) => http.get<Paged<NotificationDto>>('/communication/notifications', { params: { page, size: 20 } }),
  markRead: (id: string) => http.post<ApiResponse<NotificationDto>>(`/communication/notifications/${id}/read`),
  readAll: () => http.post<ApiResponse<number>>('/communication/notifications/read-all'),
};
