import { http } from '../client';
import { paymentApi } from '../paymentApi';

jest.mock('../client', () => ({ http: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('createPayment posts the order and gateway with the Idempotency-Key header', async () => {
  await paymentApi.createPayment({ orderId: 'o1', gateway: 'VNPAY', paymentMethod: 'QR' }, 'key-1');
  expect(http.post).toHaveBeenCalledWith(
    '/payment/payments',
    { orderId: 'o1', gateway: 'VNPAY', paymentMethod: 'QR' },
    { headers: { 'Idempotency-Key': 'key-1' } }
  );
});

test('createPayment leaves paymentMethod out when the option has none (MOCK)', async () => {
  await paymentApi.createPayment({ orderId: 'o1', gateway: 'MOCK' }, 'key-2');
  expect((http.post as jest.Mock).mock.calls[0][1]).toEqual({ orderId: 'o1', gateway: 'MOCK' });
});

test('read endpoints', async () => {
  await paymentApi.getPayment('p1');
  await paymentApi.getPaymentsOfOrder('o1');
  await paymentApi.getEscrow('o1');
  expect(http.get).toHaveBeenNthCalledWith(1, '/payment/payments/p1');
  expect(http.get).toHaveBeenNthCalledWith(2, '/payment/payments', { params: { orderId: 'o1' } });
  expect(http.get).toHaveBeenNthCalledWith(3, '/payment/escrows/orders/o1');
});

test('simulateMock settles a MOCK payment through the dev endpoint', async () => {
  await paymentApi.simulateMock('PAY-1', true);
  await paymentApi.simulateMock('PAY-1', false);
  expect(http.post).toHaveBeenNthCalledWith(1, '/payment/dev/payments/PAY-1/success');
  expect(http.post).toHaveBeenNthCalledWith(2, '/payment/dev/payments/PAY-1/fail');
});

test('wallet and payout endpoints call the correct payment-service routes', async () => {
  await paymentApi.getWallet();
  await paymentApi.getWalletLedger({ page: 0, size: 20 });
  await paymentApi.createTopUp({ amount: 100000, gateway: 'VNPAY' }, 'key-topup');
  await paymentApi.getTopUp('top-1');
  await paymentApi.getPayoutSettings();
  await paymentApi.savePayoutSettings({ bankName: 'Vietcombank', accountName: 'TRAN HUU TRUNG', accountNumber: '0071001234567' });
  await paymentApi.requestPayout({ amount: 500000, bankName: 'Vietcombank', accountName: 'TRAN HUU TRUNG', accountNumber: '0071001234567' }, 'key-payout');

  expect(http.get).toHaveBeenCalledWith('/payment/wallets/me');
  expect(http.get).toHaveBeenCalledWith('/payment/wallets/ledger', { params: { page: 0, size: 20 } });
  expect(http.post).toHaveBeenCalledWith(
    '/payment/wallets/topup',
    { amount: 100000, gateway: 'VNPAY' },
    { headers: { 'Idempotency-Key': 'key-topup' } }
  );
  expect(http.get).toHaveBeenCalledWith('/payment/wallets/topup/top-1');
  expect(http.get).toHaveBeenCalledWith('/payment/payout-settings/me');
  expect(http.post).toHaveBeenCalledWith('/payment/payout-settings', {
    bankName: 'Vietcombank',
    accountName: 'TRAN HUU TRUNG',
    accountNumber: '0071001234567'
  });
  expect(http.post).toHaveBeenCalledWith(
    '/payment/payouts',
    { amount: 500000, bankName: 'Vietcombank', accountName: 'TRAN HUU TRUNG', accountNumber: '0071001234567' },
    { headers: { 'Idempotency-Key': 'key-payout' } }
  );
});
