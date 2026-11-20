import { http } from './client';
import type { ApiResponse, CancellationBody, CancellationDto, ExecutionDto, OrderAgreementVersion, OrderAmendment, OrderAmendmentDraft, OrderCreationRequest, OrderDelivery, OrderDetailDto, OrderDto, OrderHistoryDto, OrderRevision, OrderRole, Paged } from './types';

// order-service endpoints via gateway (/api/v1/order/**).
export const orderApi = {
  // roleName: which side of the order the caller is on.
  getMyOrders: (roleName: OrderRole, page = 0, size = 10) =>
    http.get<Paged<OrderDto>>('/order/orders', { params: { roleName, page, size } }),

  getOrder: (orderId: string) => http.get<ApiResponse<OrderDetailDto>>(`/order/orders/${orderId}`),

  getHistory: (orderId: string) => http.get<ApiResponse<OrderHistoryDto[]> | Paged<OrderHistoryDto>>(`/order/orders/${orderId}/history`),

  getExecution: (orderId: string) => http.get<ApiResponse<ExecutionDto>>(`/order/orders/${orderId}/execution`),

  uploadFile: (orderId: string, context: 'WORK_EVIDENCE' | 'DELIVERY', body: FormData) => {
    body.append('context', context);
    return http.post<ApiResponse<{ storedFileId: string }>>(`/order/orders/${orderId}/files`, body, { timeoutMs: 120000 });
  },

  getDownloadUrl: (orderId: string, fileId: string) =>
    http.get<ApiResponse<{ url: string; expiresAt: string }>>(`/order/orders/${orderId}/files/${fileId}/download-url`),

  getDeliveries: (orderId: string) => http.get<ApiResponse<OrderDelivery[]>>(`/order/orders/digital/${orderId}/submissions`),

  submitDelivery: (orderId: string, body: { message?: string; files: { fileId: string }[] }) =>
    http.post<ApiResponse<OrderDelivery>>(`/order/orders/digital/${orderId}/submissions`, body),

  submitRequirements: (orderId: string, values: { description: string; references: string[] }) =>
    http.post<ApiResponse<void>>(`/order/orders/digital/${orderId}/requirements`, { values }),

  getRevisions: (orderId: string) => http.get<ApiResponse<OrderRevision[]>>(`/order/orders/digital/${orderId}/revisions`),

  requestRevision: (orderId: string, reason: string) =>
    http.post<ApiResponse<OrderRevision>>(`/order/orders/digital/${orderId}/revisions`, { reason }),

  acceptDelivery: (orderId: string) =>
    http.post<ApiResponse<ExecutionDto['digital']>>(`/order/orders/digital/${orderId}/accept`),

  getAgreement: (orderId: string) => http.get<ApiResponse<OrderAgreementVersion[]>>(`/order/orders/${orderId}/agreement`),

  getAmendments: (orderId: string) => http.get<ApiResponse<OrderAmendment[]>>(`/order/orders/${orderId}/amendments`),

  proposeAmendment: (orderId: string, body: OrderAmendmentDraft) =>
    http.post<ApiResponse<OrderAmendment>>(`/order/orders/${orderId}/amendments`, body),

  respondAmendment: (orderId: string, amendmentId: string, action: 'accept' | 'reject') =>
    http.post<ApiResponse<OrderAmendment>>(`/order/orders/${orderId}/amendments/${amendmentId}/${action}`),

  settleAmendment: (orderId: string, amendmentId: string) =>
    http.post<ApiResponse<OrderAmendment>>(`/order/orders/${orderId}/amendments/${amendmentId}/settle`),

  confirmCashReceived: (orderId: string) =>
    http.post<ApiResponse<NonNullable<ExecutionDto['onsite']>>>(`/order/orders/onsite/${orderId}/cash-received`),

  getCheckinCode: (orderId: string) =>
    http.get<ApiResponse<{ checkinCode: string }>>(`/order/orders/onsite/${orderId}/checkin-code`),

  checkInOnsite: (orderId: string, code: string) =>
    http.post<ApiResponse<NonNullable<ExecutionDto['onsite']>>>(`/order/orders/onsite/${orderId}/checkin`, { code }),

  completeOnsite: (orderId: string) =>
    http.post<ApiResponse<NonNullable<ExecutionDto['onsite']>>>(`/order/orders/onsite/${orderId}/complete`),

  acceptOnsite: (orderId: string) =>
    http.post<ApiResponse<NonNullable<ExecutionDto['onsite']>>>(`/order/orders/onsite/${orderId}/accept`),

  // Pricing is computed server-side. ONSITE requires bookingSlotId + address.
  createOrder: (body: OrderCreationRequest, idempotencyKey?: string) =>
    http.post<ApiResponse<OrderDto>>('/order/orders', body, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}),

  // 404 until someone asks to cancel. Answers AUTO_APPROVED for an unpaid
  // order, PENDING for a paid one until the other side responds.
  getCancellation: (orderId: string) => http.get<ApiResponse<CancellationDto>>(`/order/orders/${orderId}/cancellation`),

  cancelOrder: (orderId: string, body: CancellationBody) =>
    http.post<ApiResponse<CancellationDto>>(`/order/orders/${orderId}/cancel`, body),

  respondCancellation: (orderId: string, body: { accept: boolean }) =>
    http.post<ApiResponse<CancellationDto>>(`/order/orders/${orderId}/cancel/respond`, body),
};
