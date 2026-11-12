import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { ApiError } from '@/api/errors';

import { useMyServices, useSetServiceStatus } from '../hooks';
import { MyServicesScreen } from '../MyServicesScreen';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }) }));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useMyServices: jest.fn(),
  useSetServiceStatus: jest.fn(),
  useDeleteService: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('../NotProviderNotice', () => {
  const { Text } = jest.requireActual('react-native');
  return { NotProviderNotice: () => <Text>not-provider-notice</Text> };
});

const failed = (error: unknown) => ({ data: undefined, error, isError: true, isPending: false, isRefetching: false, refetch: jest.fn() });

const row = {
  serviceId: 's1',
  title: 'Sửa máy lạnh',
  categoryId: 'c1',
  executionType: 'ONSITE',
  status: 'ACTIVE',
  basePrice: 200000,
  maxPrice: 200000,
  packagesCount: 1,
  ordersCount: 0,
  avgRating: 0,
  reviewCount: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useSetServiceStatus as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
});

test('a 1007 403 shows the not-provider notice', async () => {
  (useMyServices as jest.Mock).mockReturnValue(failed(new ApiError(401, { code: 1007 })));
  await render(<MyServicesScreen />);
  expect(screen.getByText('not-provider-notice')).toBeTruthy();
});

test('a 1025 403 is not mistaken for "not a provider"', async () => {
  (useMyServices as jest.Mock).mockReturnValue(failed(new ApiError(403, { code: 1025, message: 'You are not the owner of this service' })));
  await render(<MyServicesScreen />);
  expect(screen.queryByText('not-provider-notice')).toBeNull();
  expect(screen.getByText('Không tải được dữ liệu')).toBeTruthy();
});

test('a status change rejected with 1025 alerts the owner message', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const mutate = jest.fn((_vars, opts: { onError: (e: unknown) => void }) => opts.onError(new ApiError(403, { code: 1025 })));
  (useSetServiceStatus as jest.Mock).mockReturnValue({ mutate, isPending: false });
  (useMyServices as jest.Mock).mockReturnValue({ data: [row], isError: false, isPending: false, isRefetching: false, refetch: jest.fn() });
  await render(<MyServicesScreen />);
  // The status filter chip is also named "Tạm dừng"; the card's button comes last.
  await fireEvent.press(screen.getAllByRole('button', { name: 'Tạm dừng' }).at(-1)!);
  expect(alert).toHaveBeenCalledWith('Không thực hiện được', 'Bạn không phải chủ dịch vụ này.');
});
