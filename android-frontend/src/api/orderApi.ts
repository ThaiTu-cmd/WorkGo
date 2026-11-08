import { http } from './client';
import type { ApiResponse, CancellationBody, CancellationDto, ExecutionDto, OrderCreationRequest, OrderDto, OrderHistoryDto, OrderRole, Paged } from './types';

// order-service endpoints via gateway (/api/v1/order/**).
export const orderApi = {
  // roleName: which side of the order the caller is on.
  getMyOrders: (roleName: OrderRole, page = 0, size = 10) =>
    http.get<Paged<OrderDto>>('/order/orders', { params: { roleName, page, size } }),

  getOrder: (orderId: string) => http.get<ApiResponse<OrderDto>>(`/order/orders/${orderId}`),

  getHistory: (orderId: string) => http.get<ApiResponse<OrderHistoryDto[]> | Paged<OrderHistoryDto>>(`/order/orders/${orderId}/history`),

  getExecution: (orderId: string) => http.get<ApiResponse<ExecutionDto>>(`/order/orders/${orderId}/execution`),

  // Pricing is computed server-side. ONSITE requires bookingSlotId + address.
  createOrder: (body: OrderCreationRequest) => http.post<ApiResponse<OrderDto>>('/order/orders', body),

  // 404 until someone asks to cancel. Answers AUTO_APPROVED for an unpaid
  // order, PENDING for a paid one until the other side responds.
  getCancellation: (orderId: string) => http.get<ApiResponse<CancellationDto>>(`/order/orders/${orderId}/cancellation`),

  cancelOrder: (orderId: string, body: CancellationBody) =>
    http.post<ApiResponse<CancellationDto>>(`/order/orders/${orderId}/cancel`, body),

  respondCancellation: (orderId: string, body: { accept: boolean }) =>
    http.post<ApiResponse<CancellationDto>>(`/order/orders/${orderId}/cancel/respond`, body),
};
