import { fireEvent, render, screen } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { useServiceDetail } from '@/features/catalog/hooks';

import { useSaveService } from '../hooks';
import { ServiceFormScreen } from '../ServiceFormScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 's1' }),
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/lib/image', () => ({ pickImage: jest.fn() }));
jest.mock('@/features/catalog/hooks', () => ({
  useServiceDetail: jest.fn(),
  useCategories: () => ({ data: { roots: [{ categoryId: 'c1', name: 'Sửa chữa' }], all: [{ categoryId: 'c1', name: 'Sửa chữa' }] } }),
}));
jest.mock('../hooks', () => ({ ...jest.requireActual('../hooks'), useSaveService: jest.fn() }));

beforeEach(() => {
  (useServiceDetail as jest.Mock).mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      slug: 'sua-may-lanh',
      title: 'Sửa máy lạnh tận nơi',
      categoryId: 'c1',
      executionType: 'ONSITE',
      description: 'Vệ sinh và sửa máy lạnh tại nhà, có bảo hành.',
      packages: [{ id: 'pk1', name: 'Cơ bản', price: 250000, durationMinute: 60 }],
      mediaList: [],
    },
  });
});

test('a save rejected with 1025 shows the owner message', async () => {
  const mutateAsync = jest.fn().mockRejectedValue(new ApiError(403, { code: 1025, message: 'You are not the owner of this service' }));
  (useSaveService as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });
  await render(<ServiceFormScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Tiếp' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Tiếp' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  expect(await screen.findByText('Bạn không phải chủ dịch vụ này.')).toBeTruthy();
  expect(mutateAsync).toHaveBeenCalledTimes(1);
});
