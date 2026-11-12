import { catalogApi } from '../catalogApi';
import { http } from '../client';

jest.mock('../client', () => ({ http: { get: jest.fn(), put: jest.fn(), patch: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('setServiceStatus is a single PATCH /status with only the status', async () => {
  await catalogApi.setServiceStatus('s1', 'PAUSED');
  expect(http.patch).toHaveBeenCalledWith('/catalog/services/s1/status', { status: 'PAUSED' });
  expect(http.get).not.toHaveBeenCalled();
  expect(http.put).not.toHaveBeenCalled();
});
