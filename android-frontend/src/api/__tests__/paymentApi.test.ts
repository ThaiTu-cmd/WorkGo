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
