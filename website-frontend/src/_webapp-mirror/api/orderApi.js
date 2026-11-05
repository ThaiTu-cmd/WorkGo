import axiosClient from './axiosClient.js';

// order-service endpoints via gateway (/api/v1/order/**).
export const orderApi = {
  // roleName: 'CLIENT' | 'PROVIDER' — which side of the order the caller is on.
  getMyOrders: (roleName, page = 0, size = 10) =>
    axiosClient.get('/order/orders', { params: { roleName, page, size } }),

  getOrder: (orderId) => axiosClient.get(`/order/orders/${orderId}`),

  getOrderHistory: (orderId, page = 0, size = 10) =>
    axiosClient.get(`/order/orders/${orderId}/history`, { params: { page, size } }),

  // ExecutionResponse { executionType, startedAt, deliveredAt, completedAt,
  //   digital: { status, deadlineAt, revisionLimit, revisionsUsed, requirementSubmittedAt },
  //   onsite:  { status, addressSnapshot, scheduledStart, scheduledEnd, ... } }
  getExecution: (orderId) => axiosClient.get(`/order/orders/${orderId}/execution`),

  // body: { serviceId, packageId, addonIds, bookingSlotId, address } — pricing is computed server-side.
  createOrder: (body) => axiosClient.post('/order/orders', body),

  // Cancellation flow (POST /orders/{id}/cancel, POST /orders/{id}/cancel/respond, GET /orders/{id}/cancellation)
  cancelOrder: (orderId, body) =>
    axiosClient.post(`/order/orders/${orderId}/cancel`, body),

  respondCancellation: (orderId, body) =>
    axiosClient.post(`/order/orders/${orderId}/cancel/respond`, body),

  getCancellation: (orderId) =>
    axiosClient.get(`/order/orders/${orderId}/cancellation`),

  // Digital execution flow (POST requirements, submissions, revisions, accept)
  submitRequirements: (orderId, body) => {
    const payload = body?.values ? body : { values: body || {} };
    return axiosClient.post(`/order/orders/digital/${orderId}/requirements`, payload);
  },

  submitDelivery: (orderId, body) => {
    const payload = {
      message: body.message || body.note || 'Bàn giao kết quả đơn hàng',
      files: body.files || (body.attachmentUrls || ['https://workgo.vn/demo-delivery']).map((url, idx) => ({
        fileUrl: typeof url === 'string' ? url : url.fileUrl,
        fileName: typeof url === 'string' ? `delivery_file_${idx + 1}` : url.fileName,
        mimeType: typeof url === 'string' ? 'application/octet-stream' : (url.mimeType || 'application/octet-stream'),
        sizeBytes: typeof url === 'string' ? 1024 : (url.sizeBytes || 1024),
        fileHash: typeof url === 'string' ? 'hash' : (url.fileHash || 'hash'),
      })),
    };
    return axiosClient.post(`/order/orders/digital/${orderId}/submissions`, payload);
  },

  getSubmissions: (orderId) =>
    axiosClient.get(`/order/orders/digital/${orderId}/submissions`),

  requestRevision: (orderId, body) => {
    const payload = typeof body === 'string' ? { reason: body } : { reason: body?.reason || body?.note || '' };
    return axiosClient.post(`/order/orders/digital/${orderId}/revisions`, payload);
  },

  getRevisions: (orderId) =>
    axiosClient.get(`/order/orders/digital/${orderId}/revisions`),

  acceptDelivery: (orderId) =>
    axiosClient.post(`/order/orders/digital/${orderId}/accept`),

  // Onsite execution flow (POST checkin, complete, accept)
  checkinOnsite: (orderId, body) => {
    const payload = typeof body === 'string' ? { code: body } : { code: body?.code || body?.checkinCode || '' };
    return axiosClient.post(`/order/orders/onsite/${orderId}/checkin`, payload);
  },

  completeOnsite: (orderId) =>
    axiosClient.post(`/order/orders/onsite/${orderId}/complete`),

  acceptOnsite: (orderId) =>
    axiosClient.post(`/order/orders/onsite/${orderId}/accept`),

  // Work evidence (BEFORE / AFTER photo upload for Onsite execution)
  createEvidence: (orderId, body) =>
    axiosClient.post(`/order/orders/${orderId}/evidence`, body),

  getEvidence: (orderId, params) =>
    axiosClient.get(`/order/orders/${orderId}/evidence`, { params }),

  // Dev / Escrow Payment confirmation
  confirmPayment: (orderId) =>
    axiosClient.post(`/order/internal/orders/${orderId}/confirm`),
};

// order-service supports both DIGITAL and ONSITE executions
export const ORDERABLE_EXECUTION_TYPES = ['DIGITAL', 'ONSITE'];
export const isOrderable = (executionType) => ORDERABLE_EXECUTION_TYPES.includes(executionType);
export const NOT_ORDERABLE_MESSAGE =
  'WorkGo hiện hỗ trợ đặt dịch vụ Online (Digital) và dịch vụ Tận nơi (Onsite).';

export default orderApi;
