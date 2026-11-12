import { availabilityApi } from '../availabilityApi';
import { http } from '../client';

jest.mock('../client', () => ({ http: { get: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('getSlots sends the from/to window and size', async () => {
  await availabilityApi.getSlots('s1', { from: 'A', to: 'B', size: 100 });
  expect(http.get).toHaveBeenCalledWith('/catalog/slots/services/s1', { params: { page: 0, size: 100, from: 'A', to: 'B' } });
});

test('getSlots leaves from/to out when not given', async () => {
  await availabilityApi.getSlots('s1');
  const [, opts] = (http.get as jest.Mock).mock.calls[0];
  expect(opts.params).not.toHaveProperty('from');
  expect(opts.params).not.toHaveProperty('to');
});
