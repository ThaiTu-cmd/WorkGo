import { catalogApi } from '@/api/catalogApi';

import { newSaveProgress, saveService } from '../hooks';

jest.mock('@/api/catalogApi', () => ({
  catalogApi: {
    createService: jest.fn(async () => ({ result: { serviceId: 'new1' } })),
    updateService: jest.fn(async () => ({})),
    createPackage: jest.fn(async (_s: string, b: { name: string }) => ({ result: { packageId: `pk-${b.name}` } })),
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
  expect(api.createService).toHaveBeenCalledWith(
    expect.objectContaining({ categoryId: 'c1', executionType: 'ONSITE', title: 'Sửa máy lạnh', basePrice: 200000, currency: 'VND' })
  );
  expect(api.createPackage).toHaveBeenCalledTimes(2);
  expect(api.createMedia.mock.calls.map(([, b]) => b.cover)).toEqual([true, false]);
  expect(api.setServiceStatus).toHaveBeenCalledWith('new1', 'PUBLISHED');
  expect(api.updateService).not.toHaveBeenCalled();
});

test('new service slug is the title plus a random suffix (slug is unique server-side)', async () => {
  await saveService({ serviceId: null, info, packages: [{ name: 'A', price: 1 }], images: [], hasCover: false });
  await saveService({ serviceId: null, info, packages: [{ name: 'A', price: 1 }], images: [], hasCover: false });
  const [first, second] = api.createService.mock.calls.map(([b]) => b.slug);
  expect(first).toMatch(/^sua-may-lanh-[a-z0-9]{4}$/);
  expect(second).toMatch(/^sua-may-lanh-[a-z0-9]{4}$/);
  expect(first).not.toBe(second);
});

test('retry after a media failure resumes without re-creating the service or packages', async () => {
  const progress = newSaveProgress();
  const input = {
    serviceId: null,
    info,
    packages: [{ name: 'Cơ bản', price: 200000 }],
    images: ['data:a', 'data:b'],
    hasCover: false,
  };
  api.createMedia.mockResolvedValueOnce({} as never).mockRejectedValueOnce(new Error('value too long'));
  await expect(saveService(input, progress)).rejects.toThrow('value too long');
  expect(progress.serviceId).toBe('new1');

  await saveService(input, progress);
  expect(api.createService).toHaveBeenCalledTimes(1);
  expect(api.createPackage).toHaveBeenCalledTimes(1);
  expect(api.createMedia.mock.calls.map(([, b]) => b.url)).toEqual(['data:a', 'data:b', 'data:b']);
  expect(api.setServiceStatus).toHaveBeenCalledTimes(1);
});

test('edit: keeps the stored slug, re-sends the current status, updates existing packages, adds new ones, keeps the cover', async () => {
  await saveService({
    serviceId: 's1',
    currentSlug: 'sua-may-lanh-ab12',
    currentStatus: 'PAUSED',
    info: { ...info, title: 'Sửa máy lạnh tận nơi' },
    packages: [
      { id: 'pk1', name: 'Cơ bản', price: 250000 },
      { name: 'Mới', price: 400000 },
    ],
    images: ['data:c'],
    hasCover: true,
  });

  expect(api.updateService).toHaveBeenCalledWith(
    's1',
    expect.objectContaining({ status: 'PAUSED', basePrice: 250000, slug: 'sua-may-lanh-ab12' })
  );
  expect(api.updatePackage).toHaveBeenCalledWith('pk1', expect.objectContaining({ price: 250000 }));
  expect(api.createPackage).toHaveBeenCalledWith('s1', expect.objectContaining({ name: 'Mới' }));
  expect(api.createMedia).toHaveBeenCalledWith('s1', { url: 'data:c', mediaType: 'IMAGE', cover: false });
  expect(api.setServiceStatus).not.toHaveBeenCalled();
});
