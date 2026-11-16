import { catalogApi } from '@/api/catalogApi';
import { ApiError } from '@/api/errors';
import { providerApi } from '@/api/providerApi';

import { listAllServices } from '../listAllServices';

jest.mock('@/api/catalogApi', () => ({ catalogApi: { getRootCategories: jest.fn(), listServices: jest.fn() } }));
jest.mock('@/api/providerApi', () => ({ providerApi: { getProvider: jest.fn() } }));

const catalog = catalogApi as jest.Mocked<typeof catalogApi>;
const providers = providerApi as jest.Mocked<typeof providerApi>;

const page = <T>(data: T[]) => ({ result: { data } }) as never;
const svc = (id: string, categoryId: string, extra = {}) => ({
  serviceId: id,
  providerId: 'p1',
  categoryId,
  title: `Service ${id}`,
  executionType: 'DIGITAL',
  basePrice: 100,
  ...extra,
});

beforeEach(() => {
  jest.resetAllMocks();
  catalog.getRootCategories.mockResolvedValue(
    page([{ categoryId: 'c1', name: 'Thiết kế', children: [{ categoryId: 'c1a', name: 'Logo' }] }])
  );
  providers.getProvider.mockResolvedValue({ result: { providerProfileId: 'p1', businessName: 'Studio An' } } as never);
});

const paged = <T>(data: T[], totalPages: number) => ({ result: { data, totalPages } }) as never;

test('listAllServices pages through GET /catalog/services without filters', async () => {
  catalog.listServices
    .mockResolvedValueOnce(paged([svc('s1', 'c1'), svc('s2', 'c1')], 3))
    .mockResolvedValueOnce(paged([svc('s2', 'c1')], 3))
    .mockResolvedValueOnce(paged([svc('s3', 'c1a')], 3));
  const cards = await listAllServices();
  expect(catalog.listServices.mock.calls.map(([p]) => p)).toEqual([
    { page: 0, size: 100 },
    { page: 1, size: 100 },
    { page: 2, size: 100 },
  ]);
  expect(cards.map((c) => c.serviceId)).toEqual(['s1', 's2', 's3']);
  expect(cards.find((c) => c.serviceId === 's3')?.categoryName).toBe('Logo');
  expect(cards[0].provider.name).toBe('Studio An');
  expect(providers.getProvider).toHaveBeenCalledTimes(1);
});

test('listAllServices stops after the first page when totalPages is missing', async () => {
  catalog.listServices.mockResolvedValue(page([svc('s1', 'c1')]));
  await listAllServices();
  expect(catalog.listServices).toHaveBeenCalledTimes(1);
});

test('listAllServices rethrows when a page cannot be loaded', async () => {
  catalog.listServices.mockRejectedValue(new ApiError(0, null));
  await expect(listAllServices()).rejects.toBeInstanceOf(ApiError);
});

test('listAllServices keeps services when provider lookup 401s', async () => {
  catalog.listServices.mockResolvedValueOnce(page([svc('s1', 'c1')])).mockResolvedValue(page([]));
  providers.getProvider.mockRejectedValue(new ApiError(401, { code: 1006 }));
  const cards = await listAllServices();
  expect(cards).toHaveLength(1);
  expect(cards[0].provider.name).toBe('Nhà cung cấp');
});

test('listAllServices rethrows when categories cannot be loaded', async () => {
  catalog.getRootCategories.mockRejectedValue(new ApiError(0, null));
  await expect(listAllServices()).rejects.toBeInstanceOf(ApiError);
});
