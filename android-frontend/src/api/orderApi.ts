import { http } from './client';
import type { ApiResponse, ExecutionDto, OrderCreationRequest, OrderDto, OrderHistoryDto, OrderRole, Paged } from './types';

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
};
