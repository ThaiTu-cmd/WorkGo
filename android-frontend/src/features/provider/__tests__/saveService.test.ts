import { catalogApi } from '@/api/catalogApi';

import { saveService } from '../hooks';

jest.mock('@/api/catalogApi', () => ({
  catalogApi: {
    createService: jest.fn(async () => ({ result: { serviceId: 'new1' } })),
    updateService: jest.fn(async () => ({})),
    createPackage: jest.fn(async () => ({})),
    updatePackage: jest.fn(async () => ({})),
    createMedia: jest.fn(async () => ({})),
    setServiceStatus: jest.fn(async () => ({})),
  },
}));

const api = catalogApi as jest.Mocked<typeof catalogApi>;
const info = { title: 'Sửa máy lạnh', categoryId: 'c1', executionType: 'ONSITE' as const, description: 'x'.repeat(30) };

beforeEach(() => jest.clearAllMocks());

test('new service: create → packages → media (first is cover) → publish', async () => {
  const id = await saveService({
    serviceId: null,
    info,
    packages: [
      { name: 'Tiêu chuẩn', price: 300000 },
      { name: 'Cơ bản', price: 200000 },
    ],
    images: ['data:a', 'data:b'],
    hasCover: false,
  });

  expect(id).toBe('new1');
  expect(api.createService).toHaveBeenCalledWith({
    categoryId: 'c1',
    executionType: 'ONSITE',
    title: 'Sửa máy lạnh',
    slug: 'sua-may-lanh',
    description: 'x'.repeat(30),
    basePrice: 200000,
    currency: 'VND',
  });
  expect(api.createPackage).toHaveBeenCalledTimes(2);
  expect(api.createMedia.mock.calls.map(([, b]) => b.cover)).toEqual([true, false]);
  expect(api.setServiceStatus).toHaveBeenCalledWith('new1', 'PUBLISHED');
  expect(api.updateService).not.toHaveBeenCalled();
});

test('edit: re-sends the current status, updates existing packages, adds new ones, keeps the cover', async () => {
  await saveService({
    serviceId: 's1',
    currentStatus: 'PAUSED',
    info,
    packages: [
      { id: 'pk1', name: 'Cơ bản', price: 250000 },
      { name: 'Mới', price: 400000 },
    ],
    images: ['data:c'],
    hasCover: true,
  });

  expect(api.updateService).toHaveBeenCalledWith('s1', expect.objectContaining({ status: 'PAUSED', basePrice: 250000 }));
  expect(api.updatePackage).toHaveBeenCalledWith('pk1', expect.objectContaining({ price: 250000 }));
  expect(api.createPackage).toHaveBeenCalledWith('s1', expect.objectContaining({ name: 'Mới' }));
  expect(api.createMedia).toHaveBeenCalledWith('s1', { url: 'data:c', mediaType: 'IMAGE', cover: false });
  expect(api.setServiceStatus).not.toHaveBeenCalled();
});
