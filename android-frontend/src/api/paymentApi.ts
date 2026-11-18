import { http } from './client';
import type {
  ApiResponse,
  EscrowDto,
  PaymentCreationRequest,
  PaymentDto,
  WalletDto,
  WalletEntryDto,
  TopUpCreationRequest,
  TopUpDto,
  PayoutSettingsDto,
  PayoutRequest,
  PayoutDto,
  PageResponse
} from './types';

// payment-service endpoints via gateway (/api/v1/payment/**).
//
// The client creates a payment for a PENDING_PAYMENT order; VNPay / MoMo answer
// with a `paymentUrl`. Their IPN reaches payment-service, which confirms the
// order. The browser redirect never reaches the app, so the app polls
// GET /payments/{id} for the result.
export const paymentApi = {
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

  // DEV ONLY (payment-service profile "dev"): settle a MOCK payment as a gateway would.
  simulateMock: (paymentCode: string, success: boolean) =>
    http.post<ApiResponse<PaymentDto>>(`/payment/dev/payments/${paymentCode}/${success ? 'success' : 'fail'}`),

  // ---- Wallet & Ledger endpoints (FE-12) ----
  getWallet: () => http.get<ApiResponse<WalletDto>>('/payment/wallets/me'),

  getWalletLedger: (params?: { page?: number; size?: number; type?: string }) =>
    http.get<ApiResponse<PageResponse<WalletEntryDto> | WalletEntryDto[]>>('/payment/wallets/ledger', { params }),

  createTopUp: (body: TopUpCreationRequest, idempotencyKey: string) =>
    http.post<ApiResponse<TopUpDto>>('/payment/wallets/topup', body, {
      headers: { 'Idempotency-Key': idempotencyKey }
    }),

  getTopUp: (topUpId: string) => http.get<ApiResponse<TopUpDto>>(`/payment/wallets/topup/${topUpId}`),

  // ---- Payout Settings & Request (FE-12) ----
  getPayoutSettings: () => http.get<ApiResponse<PayoutSettingsDto>>('/payment/payout-settings/me'),

  savePayoutSettings: (body: PayoutSettingsDto) =>
    http.post<ApiResponse<PayoutSettingsDto>>('/payment/payout-settings', body),

  requestPayout: (body: PayoutRequest, idempotencyKey: string) =>
    http.post<ApiResponse<PayoutDto>>('/payment/payouts', body, {
      headers: { 'Idempotency-Key': idempotencyKey }
    }),
};
