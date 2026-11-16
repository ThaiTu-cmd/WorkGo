import axiosClient from './axiosClient.js';

// payment-service endpoints via gateway (/api/v1/payment/**).
//
// Flow: the client creates a payment for a PENDING_PAYMENT order, the browser goes
// to `paymentUrl` (VNPay / MoMo). The gateway calls payment-service back (IPN),
// payment-service confirms the order in order-service, and the browser is sent
// to /payment/result?paymentId=…&result=success|failed|invalid. The result page
// polls GET /payments/{id} because the redirect itself does not change any data.

// Mirrors order-service `order.payment-timeout-minutes`: an unpaid order is
// cancelled (and its booking slot released) this long after it was created.
export const ORDER_PAYMENT_TIMEOUT_MINUTES = 30;

export const PAYMENT_WAITING_STATUSES = ['INITIATED', 'PENDING'];
export const isPaymentWaiting = (payment) => PAYMENT_WAITING_STATUSES.includes(payment?.status);

const newIdempotencyKey = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // insecure context: fall through
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const paymentApi = {
  // body: { orderId, gateway: 'MOCK'|'VNPAY'|'MOMO', paymentMethod?: 'QR'|'WALLET'|'ATM_CARD'|'INTL_CARD' }
  // PaymentResponse { paymentId, paymentCode, orderId, amount, gateway, paymentMethod,
  //   status, paymentUrl, qrCodeUrl, deeplink, failureCode, failureMessage, paidAt, expiresAt }
  // A still-valid PENDING payment of the same gateway is returned instead of a new one.
  createPayment: ({ orderId, gateway, paymentMethod }, idempotencyKey = newIdempotencyKey()) =>
    axiosClient.post(
      '/payment/payments',
      { orderId, gateway, ...(paymentMethod && { paymentMethod }) },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),

  getPayment: (paymentId) => axiosClient.get(`/payment/payments/${paymentId}`),

  getPaymentsOfOrder: (orderId) => axiosClient.get('/payment/payments', { params: { orderId } }),

  // EscrowAccountResponse { status: HOLDING|RELEASED|REFUNDED|…, heldAmount, releasedAmount, refundedAmount, … }
  getEscrow: (orderId) => axiosClient.get(`/payment/escrows/orders/${orderId}`),

  // DEV ONLY (payment-service profile "dev"): settle a MOCK payment as the gateway would.
  simulateMockPayment: (paymentCode, success) =>
    axiosClient.post(`/payment/dev/payments/${paymentCode}/${success ? 'success' : 'fail'}`),
};

// The MOCK gateway has no hosted page; it only exists while payment-service runs
// with the "dev" profile. Shown outside production builds unless turned off with
// NEXT_PUBLIC_ENABLE_MOCK_PAYMENT=false (or forced on with "true").
const MOCK_FLAG = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT;
export const MOCK_PAYMENT_ENABLED = MOCK_FLAG ? MOCK_FLAG === 'true' : process.env.NODE_ENV !== 'production';

// Payment options offered to the client. name / desc are "misc" dictionary keys.
export const PAYMENT_OPTIONS = [
  { id: 'vnpay-qr', gateway: 'VNPAY', paymentMethod: 'QR', name: 'm1640', desc: 'm1636', logo: 'VNPAY', logoClass: 'gwVnpay' },
  { id: 'vnpay-card', gateway: 'VNPAY', paymentMethod: 'INTL_CARD', name: 'm1634', desc: 'm1642', logo: 'VISA', logoClass: 'gwCard' },
  { id: 'momo', gateway: 'MOMO', paymentMethod: 'WALLET', name: 'm1633', desc: 'm1637', logo: 'MoMo', logoClass: 'gwMomo' },
  ...(MOCK_PAYMENT_ENABLED
    ? [{ id: 'mock', gateway: 'MOCK', name: 'm1706', desc: 'm1707', logo: 'TEST', logoClass: 'gwMock' }]
    : []),
];
export const DEFAULT_PAYMENT_OPTION = MOCK_PAYMENT_ENABLED ? 'mock' : 'vnpay-qr';
export const findPaymentOption = (id) => PAYMENT_OPTIONS.find((o) => o.id === id) || PAYMENT_OPTIONS[0];

// Creates the payment for `orderId` with the chosen option. VNPay / MoMo leave the
// app (window.location to the hosted page); MOCK calls `onMock(payment)` so the
// caller can open the in-app result page, where the result is simulated.
export async function startPayment(orderId, optionId, { onMock } = {}) {
  const option = findPaymentOption(optionId);
  const res = await paymentApi.createPayment({
    orderId,
    gateway: option.gateway,
    paymentMethod: option.paymentMethod,
  });
  const payment = res?.result ?? res;
  if (option.gateway !== 'MOCK' && payment?.paymentUrl && typeof window !== 'undefined') {
    window.location.assign(payment.paymentUrl);
    return payment;
  }
  if (onMock) onMock(payment);
  return payment;
}

// payment-service error codes → messages the user can act on. Its 3xxx codes
// overlap order-service's, so keep the two maps apart.
const ERROR_MESSAGES = {
  1005: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  1008: 'Bạn không có quyền thanh toán đơn này.',
  2001: 'Không tìm thấy đơn hàng cần thanh toán.',
  2002: 'Dịch vụ đơn hàng đang bận. Vui lòng thử lại sau ít phút.',
  3001: 'Không tìm thấy giao dịch thanh toán.',
  3002: 'Đơn này không còn ở trạng thái chờ thanh toán.',
  3003: 'Đơn này đã được thanh toán.',
  3005: 'Yêu cầu thanh toán bị trùng. Vui lòng thử lại.',
  3007: 'Cổng thanh toán này chưa được hỗ trợ.',
  3009: 'Khung giờ đã hết thời gian giữ chỗ. Vui lòng đặt đơn mới.',
  3012: 'Số tiền nằm ngoài hạn mức của cổng thanh toán này. Hãy chọn cổng khác.',
  3101: 'Chưa có thông tin ký quỹ (escrow) cho đơn này.',
  3301: 'Cổng thanh toán tạm thời không phản hồi. Vui lòng thử lại hoặc chọn cổng khác.',
};

export const paymentErrorMessage = (err) =>
  ERROR_MESSAGES[err?.code] || err?.message || 'Không thực hiện được thanh toán. Vui lòng thử lại.';

export default paymentApi;
