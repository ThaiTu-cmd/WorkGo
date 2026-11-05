import axiosClient from './axiosClient.js';

// order-service endpoints via gateway (/api/v1/order/**).
export const orderApi = {
  // roleName: 'CLIENT' | 'PROVIDER' — which side of the order the caller is on.
  getMyOrders: (roleName, page = 0, size = 10) =>
    axiosClient.get('/order/orders', { params: { roleName, page, size } }),

  // OrderDetailResponse { order, items: OrderItemResponse[], snapshot, execution }.
  // snapshot.requirementValues holds what the client sent for a DIGITAL order.
  getOrder: (orderId) => axiosClient.get(`/order/orders/${orderId}`),

  getOrderHistory: (orderId, page = 0, size = 10) =>
    axiosClient.get(`/order/orders/${orderId}/history`, { params: { page, size } }),

  // ExecutionResponse { executionType, startedAt, deliveredAt, completedAt,
  //   digital: { status, deadlineAt, revisionLimit, revisionsUsed, requirementSubmittedAt },
  //   onsite:  { status, addressSnapshot, scheduledStart, scheduledEnd, bookingSlotId, ... } }
  getExecution: (orderId) => axiosClient.get(`/order/orders/${orderId}/execution`),

  // body: { serviceId, packageId, addonIds } — pricing is computed server-side.
  // ONSITE also needs { bookingSlotId, address }; order-service holds the slot itself.
  createOrder: (body) => axiosClient.post('/order/orders', body),

  // DEV ONLY: payment-service has no payment flow yet, so the "Thanh toán" button
  // calls order-service's internal confirm directly (reachable through the gateway).
  // PENDING_PAYMENT → CONFIRMED and books the held slot; ONSITE answers its one-time 6-digit checkinCode.
  // PaymentConfirmationResponse { orderId, orderStatus, paymentStatus, executionStatus, checkinCode }
  confirmPayment: (orderId) => axiosClient.post(`/order/internal/orders/${orderId}/confirm`),

  // ONSITE flow. Provider: checkin (CONFIRMED → IN_PROGRESS, needs the client's code),
  // complete (IN_PROGRESS → DELIVERED, needs an AFTER evidence). Client: accept (→ COMPLETED).
  checkin: (orderId, code) => axiosClient.post(`/order/orders/onsite/${orderId}/checkin`, { code }),
  completeOnsite: (orderId) => axiosClient.post(`/order/orders/onsite/${orderId}/complete`),
  acceptOnsite: (orderId) => axiosClient.post(`/order/orders/onsite/${orderId}/accept`),

  // DIGITAL flow. Client sends requirements (CONFIRMED → IN_PROGRESS), then on the
  // latest delivery either asks for a revision (DELIVERED → IN_PROGRESS) or accepts it
  // (DELIVERED → COMPLETED); provider submits deliveries (IN_PROGRESS → DELIVERED).
  // An unanswered DELIVERED order auto-completes after 72 hours.
  submitRequirements: (orderId, values) =>
    axiosClient.post(`/order/orders/digital/${orderId}/requirements`, { values }),

  // body: { message, files: [{ fileUrl, fileName, mimeType, sizeBytes }] }
  submitDelivery: (orderId, body) => axiosClient.post(`/order/orders/digital/${orderId}/submissions`, body),

  // DeliveryPackageResponse[] newest version first:
  //   { deliveryPackageId, versionNo, message, status, deliveredAt, files: [...] }
  getDeliveries: (orderId) => axiosClient.get(`/order/orders/digital/${orderId}/submissions`),

  requestRevision: (orderId, reason) =>
    axiosClient.post(`/order/orders/digital/${orderId}/revisions`, { reason }),

  // RevisionRequestResponse[] newest first: { revisionRequestId, deliveryPackageId, reason, status, createdAt, resolvedAt }
  getRevisions: (orderId) => axiosClient.get(`/order/orders/digital/${orderId}/revisions`),

  acceptDigital: (orderId) => axiosClient.post(`/order/orders/digital/${orderId}/accept`),

  // Unpaid orders cancel at once (AUTO_APPROVED); paid ones wait for the other side.
  // body: { reasonCode, note }
  cancelOrder: (orderId, body) => axiosClient.post(`/order/orders/${orderId}/cancel`, body),

  // body: { accept }
  respondCancellation: (orderId, body) => axiosClient.post(`/order/orders/${orderId}/cancel/respond`, body),

  // CancellationRequestResponse { status, requestedByRole, reasonCode, note, refundPercent, createdAt, ... }
  getCancellation: (orderId) => axiosClient.get(`/order/orders/${orderId}/cancellation`),

  // Work evidence (BEFORE / AFTER photos of an ONSITE order)
  createEvidence: (orderId, body) => axiosClient.post(`/order/orders/${orderId}/evidence`, body),
  getEvidence: (orderId, params) => axiosClient.get(`/order/orders/${orderId}/evidence`, { params }),
};

export const ORDERABLE_EXECUTION_TYPES = ['DIGITAL', 'ONSITE'];
export const isOrderable = (executionType) => ORDERABLE_EXECUTION_TYPES.includes(executionType);
export const NOT_ORDERABLE_MESSAGE =
  'Hiện WorkGo chỉ hỗ trợ đặt dịch vụ online (Digital) và tại nhà (Onsite).';

// order-service error codes of the execution flows → messages the user can act on.
const ERROR_MESSAGES = {
  1008: 'Bạn không có quyền thực hiện thao tác này trên đơn.',
  2002: 'Trạng thái hiện tại của đơn không cho phép thao tác này.',
  2004: 'Thao tác này không áp dụng cho loại dịch vụ của đơn.',
  2005: 'Không thể hủy đơn ở trạng thái hiện tại.',
  2020: 'Đơn chưa có thông tin thực hiện.',
  3001: 'Vui lòng chọn khung giờ hẹn.',
  3002: 'Vui lòng chọn địa chỉ thực hiện.',
  3003: 'Mã check-in không đúng. Hãy hỏi lại khách hàng.',
  3004: 'Chưa tới giờ check-in (chỉ được check-in sớm tối đa 30 phút).',
  3005: 'Cần ít nhất một ảnh "Sau khi làm" trước khi báo hoàn thành.',
  3006: 'Yêu cầu của đơn này đã được gửi.',
  3007: 'Cần ít nhất một file bàn giao.',
  3008: 'Chưa có bản bàn giao nào.',
  3009: 'Đơn đã dùng hết lượt chỉnh sửa.',
  3010: 'Không tìm thấy khung giờ đã chọn.',
  3011: 'Khung giờ này vừa có người đặt. Vui lòng chọn khung giờ khác.',
  3012: 'Khung giờ không thuộc dịch vụ này.',
  3013: 'Khung giờ đã hết hạn giữ chỗ. Vui lòng đặt lại đơn mới.',
  3014: 'Vui lòng chọn lý do hủy.',
  3015: 'Đơn này đã có yêu cầu hủy.',
  3016: 'Đơn này chưa có yêu cầu hủy.',
  3017: 'Yêu cầu hủy này đã được xử lý.',
  3018: 'Bạn không thể tự phản hồi yêu cầu hủy của mình.',
  3019: 'Vui lòng chọn đồng ý hoặc từ chối.',
};

export const orderErrorMessage = (err) =>
  ERROR_MESSAGES[err?.code] || err?.message || 'Không thực hiện được thao tác. Vui lòng thử lại.';

export default orderApi;
