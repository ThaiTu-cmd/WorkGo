import axiosClient from './axiosClient';

// order-service endpoints via gateway (/api/v1/order/**).
export const orderApi = {
  // roleName: 'CLIENT' | 'PROVIDER' — which side of the order the caller is on.
  getMyOrders: (roleName, page = 0, size = 10) =>
    axiosClient.get('/order/orders', { params: { roleName, page, size } }),

  getOrder: (orderId) => axiosClient.get(`/order/orders/${orderId}`),

  // ExecutionResponse { executionType, startedAt, deliveredAt, completedAt,
  //   digital: { status, deadlineAt, revisionLimit, revisionsUsed, requirementSubmittedAt },
  //   onsite:  { status, addressSnapshot, scheduledStart, scheduledEnd, ... } }
  getExecution: (orderId) => axiosClient.get(`/order/orders/${orderId}/execution`),

  // body: { serviceId, packageId, addonIds } — pricing is computed server-side.
  createOrder: (body) => axiosClient.post('/order/orders', body),
};

// order-service creates an execution per order and only supports DIGITAL so far
// (ONSITE answers ORDER_EXECUTION_TYPE_NOT_SUPPORTED).
export const ORDERABLE_EXECUTION_TYPES = ['DIGITAL'];
export const isOrderable = (executionType) => ORDERABLE_EXECUTION_TYPES.includes(executionType);
export const NOT_ORDERABLE_MESSAGE =
  'Hiện WorkGo chỉ hỗ trợ đặt dịch vụ online (Digital). Dịch vụ tận nơi sẽ sớm được mở đặt hàng.';

export default orderApi;
