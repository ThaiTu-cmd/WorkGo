export const selectOrderId = (page, params, current) =>
  page === 'orders' || page === 'order-payment' ? params.orderId || '' : params.orderId || current;
