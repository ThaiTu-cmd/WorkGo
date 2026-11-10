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

test('listAllServices queries every category × execution type with full price range', async () => {
  catalog.listServices.mockResolvedValue(page([]));
  await listAllServices();
  expect(catalog.listServices).toHaveBeenCalledTimes(4);
  const calls = catalog.listServices.mock.calls.map(([p]) => p);
  expect(calls).toEqual(
    expect.arrayContaining([
      { categoryId: 'c1', executionType: 'DIGITAL', minPrice: 0, maxPrice: 1_000_000_000_000 },
      { categoryId: 'c1', executionType: 'ONSITE', minPrice: 0, maxPrice: 1_000_000_000_000 },
      { categoryId: 'c1a', executionType: 'DIGITAL', minPrice: 0, maxPrice: 1_000_000_000_000 },
      { categoryId: 'c1a', executionType: 'ONSITE', minPrice: 0, maxPrice: 1_000_000_000_000 },
    ])
  );
});

test('listAllServices dedupes by serviceId and survives one failing call', async () => {
  catalog.listServices
    .mockResolvedValueOnce(page([svc('s1', 'c1'), svc('s2', 'c1')]))
    .mockRejectedValueOnce(new ApiError(500, null))
    .mockResolvedValueOnce(page([svc('s1', 'c1')]))
    .mockResolvedValueOnce(page([svc('s3', 'c1a')]));
  const cards = await listAllServices();
  expect(cards.map((c) => c.serviceId).sort()).toEqual(['s1', 's2', 's3']);
  expect(cards.find((c) => c.serviceId === 's3')?.categoryName).toBe('Logo');
  expect(cards[0].provider.name).toBe('Studio An');
  expect(providers.getProvider).toHaveBeenCalledTimes(1);
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
