import { http } from './client';
import type {
  ApiResponse,
  EscrowDto,
  PaymentCreationRequest,
  PaymentDto,
  WalletDto,
  FeeAssessmentDto,
  TopUpCreationRequest,
  TopUpDto,
  PayoutRequest,
  PayoutDto,
  CashReturnDto,
} from './types';

// payment-service endpoints via gateway (/api/v1/payment/**).
//
// The client creates a payment for a PENDING_PAYMENT order; VNPay / MoMo answer
// with a `paymentUrl`. Their IPN reaches payment-service, which confirms the
// order. The browser redirect never reaches the app, so the app polls
// GET /payments/{id} for the result.
export const paymentApi = {
  getCashReturn:(orderId:string)=>http.get<CashReturnDto>(`/payment/wallet/cash-returns/${orderId}`),
  confirmCashReturn:(decisionId:string,amount:number)=>http.post<CashReturnDto>(`/payment/wallet/cash-returns/${decisionId}/confirm`,{amount}),
  // A still-valid PENDING payment of the same gateway is returned instead of a new one.
  createPayment: ({ orderId, gateway, paymentMethod }: PaymentCreationRequest, idempotencyKey: string) =>
    http.post<ApiResponse<PaymentDto>>(
      '/payment/payments',
      { orderId, gateway, ...(paymentMethod && { paymentMethod }) },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ),

  getPayment: (paymentId: string) => http.get<ApiResponse<PaymentDto>>(`/payment/payments/${paymentId}`),

  getPaymentsOfOrder: (orderId: string) => http.get<ApiResponse<PaymentDto[]>>('/payment/payments', { params: { orderId } }),

  // 404 (code 3101) until the order has been paid.
  getEscrow: (orderId: string) => http.get<ApiResponse<EscrowDto>>(`/payment/escrows/orders/${orderId}`),

  // The backend returns the existing wallet escrow when this order ID is retried.
  payOrder: (orderId: string) => http.post<ApiResponse<EscrowDto>>(`/payment/wallet/orders/${orderId}/pay`),

  // DEV ONLY (payment-service profile "dev"): settle a MOCK payment as a gateway would.
  simulateMock: (paymentCode: string, success: boolean) =>
    http.post<ApiResponse<PaymentDto>>(`/payment/dev/payments/${paymentCode}/${success ? 'success' : 'fail'}`),

  // ---- Wallet & Ledger endpoints (FE-12) ----
  getWallet: () => http.get<ApiResponse<WalletDto>>('/payment/wallet'),

  getTopUps: () => http.get<ApiResponse<TopUpDto[]>>('/payment/wallet/top-ups'),
  getBeneficiaries: () => http.get<ApiResponse<{id:string;bankCode:string;accountName:string;accountNumber:string}[]>>('/payment/wallet/beneficiaries'),
  getPayoutReceipt: (key:string) => http.get<ApiResponse<PayoutDto>>('/payment/wallet/payouts/receipt',{params:{key}}),
  getPayouts: () => http.get<ApiResponse<PayoutDto[]>>('/payment/wallet/payouts'),
  getFees: () => http.get<ApiResponse<FeeAssessmentDto[]>>('/payment/wallet/fees'),

  createTopUp: (body: TopUpCreationRequest, idempotencyKey: string) =>
    http.post<ApiResponse<TopUpDto>>('/payment/wallet/top-ups', body, {
      headers: { 'Idempotency-Key': idempotencyKey }
    }),

  getTopUp: (topUpId: string) => http.get<ApiResponse<TopUpDto>>(`/payment/wallet/top-ups/${topUpId}`),

  simulateMockTopUp: (topUpCode: string, success: boolean) =>
    http.post<ApiResponse<TopUpDto>>(`/payment/dev/payments/top-ups/${topUpCode}/${success ? 'success' : 'fail'}`),

  requestPayout: (body: PayoutRequest, idempotencyKey: string) =>
    http.post<ApiResponse<PayoutDto>>('/payment/wallet/payouts', body, {
      headers: { 'Idempotency-Key': idempotencyKey }
    }),
};
