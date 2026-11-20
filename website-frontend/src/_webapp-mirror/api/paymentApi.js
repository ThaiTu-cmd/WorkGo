import axiosClient from './axiosClient.js';

// payment-service endpoints via gateway (/api/v1/payment/**).
// Orders are paid from the WorkGo wallet. Legacy gateway receipts remain readable.

// Mirrors order-service `order.payment-timeout-minutes`: an unpaid order is
// cancelled (and its booking slot released) this long after it was created.
export const ORDER_PAYMENT_TIMEOUT_MINUTES = 30;
export const TOP_UP_MINIMUM_VND = 10_000;

export const PAYMENT_WAITING_STATUSES = ['INITIATED', 'PENDING'];
export const isPaymentWaiting = (payment) => PAYMENT_WAITING_STATUSES.includes(payment?.status);

export const newIdempotencyKey = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // insecure context: fall through
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const paymentApi = {
  getPayment: (paymentId) => axiosClient.get(`/payment/payments/${paymentId}`),

  getPaymentsOfOrder: (orderId) => axiosClient.get('/payment/payments', { params: { orderId } }),

  // EscrowAccountResponse { status: HOLDING|RELEASED|REFUNDED|…, heldAmount, releasedAmount, refundedAmount, … }
  getEscrow: (orderId) => axiosClient.get(`/payment/escrows/orders/${orderId}`),

  // DEV ONLY (payment-service profile "dev"): settle a MOCK payment as the gateway would.
  simulateMockPayment: (paymentCode, success) =>
    axiosClient.post(`/payment/dev/payments/${paymentCode}/${success ? 'success' : 'fail'}`),

  simulateMockTopUp: (topUpCode, success) =>
    axiosClient.post(`/payment/dev/payments/top-ups/${topUpCode}/${success ? 'success' : 'fail'}`),

  payOrderWithWallet: (orderId) => axiosClient.post(`/payment/wallet/orders/${orderId}/pay`),

  getCurrentFeePolicy: () => axiosClient.get('/payment/fee-policies/current'),

  // Wallet & Top-up endpoints (FE-10 / Việc 20, 22, 30, 37)
  getWallet: () => axiosClient.get('/payment/wallet'),

  getTopUps: () => axiosClient.get('/payment/wallet/top-ups'),
  getFees: () => axiosClient.get('/payment/wallet/fees'),

  /**
   * @param {{ amount: number, gateway: string, paymentMethod?: string }} params
   * @param {string} [idempotencyKey]
   */
  createTopUp: ({ amount, gateway, paymentMethod }, idempotencyKey = newIdempotencyKey()) =>
    axiosClient.post(
      '/payment/wallet/top-ups',
      { amount, gateway, ...(paymentMethod && { paymentMethod }) },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),

  getTopUp: (topUpId) => axiosClient.get(`/payment/wallet/top-ups/${topUpId}`),

  pollTopUpStatus: async (topUpId, { intervalMs = 1500, maxAttempts = 20 } = {}) => {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await paymentApi.getTopUp(topUpId);
      const topUp = res?.result ?? res;
      if (topUp?.status && !['INITIATED', 'PENDING', 'UNKNOWN'].includes(topUp.status)) {
        return topUp;
      }
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
    const finalRes = await paymentApi.getTopUp(topUpId);
    return finalRes?.result ?? finalRes;
  },

  /**
   * @param {{ amount: number, bankCode: string, accountName: string, accountNumber: string }} params
   * @param {string} [idempotencyKey]
   */
  requestPayout: (
    { amount, accountName, accountNumber, bankCode },
    idempotencyKey = newIdempotencyKey(),
  ) =>
    axiosClient.post(
      '/payment/wallet/payouts',
      { amount, bankCode, accountName, accountNumber },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    ),

  getPayouts: () => axiosClient.get('/payment/wallet/payouts'),
};

// The MOCK gateway has no hosted page; it only exists while payment-service runs
// with the "dev" profile. Shown outside production builds unless turned off with
// NEXT_PUBLIC_ENABLE_MOCK_PAYMENT=false (or forced on with "true").
const MOCK_FLAG = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT;
export const MOCK_PAYMENT_ENABLED = MOCK_FLAG ? MOCK_FLAG === 'true' : process.env.NODE_ENV !== 'production';

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
  3201: 'Số dư khả dụng trong ví không đủ để thực hiện thanh toán.',
  3202: 'Số tiền nạp tối thiểu là 50.000 ₫.',
  3203: 'Số tiền nạp tối đa là 100.000.000 ₫.',
  3204: 'Giao dịch nạp tiền đang được xử lý hoặc đối soát.',
  3205: 'Không tìm thấy thông tin ví của người dùng.',
  3206: 'Tài khoản đang có dư nợ hoặc bị áp dụng chế tài, không thể rút tiền.',
  3207: 'Số tiền rút tối thiểu là 100.000 ₫.',
  3208: 'Số tiền rút vượt quá số dư khả dụng.',
  3301: 'Cổng thanh toán tạm thời không phản hồi. Vui lòng thử lại hoặc chọn cổng khác.',
};

export const paymentErrorMessage = (err) =>
  ERROR_MESSAGES[err?.code] || err?.message || 'Không thực hiện được thanh toán. Vui lòng thử lại.';

export default paymentApi;
