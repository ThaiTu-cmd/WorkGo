import axiosClient from './axiosClient';

// order-service endpoints via gateway (/api/v1/order/**).
export const orderApi = {
  // roleName: 'CLIENT' | 'PROVIDER' — which side of the order the caller is on.
  getMyOrders: (roleName, page = 0, size = 10) =>
    axiosClient.get('/order/orders', { params: { roleName, page, size } }),

  getOrder: (orderId) => axiosClient.get(`/order/orders/${orderId}`),
};

export default orderApi;
