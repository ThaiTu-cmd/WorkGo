import { http } from './client';
import type { ApiResponse, EscrowDto, PaymentCreationRequest, PaymentDto } from './types';

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
};
