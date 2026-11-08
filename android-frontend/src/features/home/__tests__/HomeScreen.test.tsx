import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ServiceCard } from '@/api/adapters';
import { useMe } from '@/features/account/hooks';
import { useCategories, useServices } from '@/features/catalog/hooks';
import { useActiveOrder } from '@/features/orders/hooks';
import { useAuth } from '@/auth/AuthProvider';

import { HomeScreen } from '../HomeScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/catalog/hooks', () => ({ useServices: jest.fn(), useCategories: jest.fn() }));
jest.mock('@/features/account/hooks', () => ({ useMe: jest.fn() }));
jest.mock('@/features/orders/hooks', () => ({ useActiveOrder: jest.fn() }));

const query = <T,>(data: T) => ({ data, isPending: false, isError: false, isRefetching: false, refetch: jest.fn() });

const card = (over: Partial<ServiceCard>): ServiceCard => ({
  serviceId: 's1',
  providerId: 'p',
  categoryId: 'c5',
  categorySlug: 'sua-chua-bao-tri',
  categoryName: 'Sửa chữa & Bảo trì',
  title: 'Sửa điện nước tại nhà',
  executionType: 'ONSITE',
  provider: { providerId: 'p', name: 'P', isVerified: false, bio: '', providerType: null, verificationStatus: null, joinedAt: null },
  avgRating: 4.8,
  reviewCount: 92,
  orderCount: 210,
  basePrice: 250000,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

function setup({ status = 'guest', scope = '', activeOrder = null as unknown }: { status?: string; scope?: string; activeOrder?: unknown } = {}) {
  (useAuth as jest.Mock).mockReturnValue({ status, claims: status === 'signedIn' ? { sub: 'an01', exp: 0, scope } : null });
  (useServices as jest.Mock).mockReturnValue(query([card({}), card({ serviceId: 's2', title: 'Thiết kế logo', executionType: 'DIGITAL', categorySlug: 'thiet-ke-do-hoa' })]));
  (useCategories as jest.Mock).mockReturnValue(
    query({ roots: [{ categoryId: 'c5', name: 'Sửa chữa & Bảo trì', slug: 'sua-chua-bao-tri' }], all: [] })
  );
  (useMe as jest.Mock).mockReturnValue(query(status === 'signedIn' ? { userName: 'an01', firstName: 'An', lastName: 'Nguyễn Văn' } : undefined));
  (useActiveOrder as jest.Mock).mockReturnValue(query(activeOrder));
}

beforeEach(() => jest.clearAllMocks());

test('guest sees a generic greeting, a sign-in button and no order card', async () => {
  setup();
  await render(<HomeScreen />);
  expect(screen.getByText('Chào bạn')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeTruthy();
  expect(screen.queryByText('Đơn đang xử lý')).toBeNull();
});

test('the search box opens Explore ready to type', async () => {
  setup();
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('search', { name: 'Tìm dịch vụ' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/explore', params: expect.objectContaining({ focus: '1' }) });
});

test('a category tile opens Explore filtered by that category', async () => {
  setup();
  await render(<HomeScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Sửa chữa & Bảo trì' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/explore', params: expect.objectContaining({ categoryId: 'c5' }) });
});

test('signed-in client is greeted by name and sees the active order', async () => {
  setup({
    status: 'signedIn',
    scope: 'ROLE_CLIENT',
    activeOrder: { orderId: 'o1', serviceId: 's1', title: 'Dọn dẹp nhà theo giờ', executionType: 'ONSITE', orderStatus: 'PENDING_PAYMENT' },
  });
  await render(<HomeScreen />);
  expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
  expect(screen.getByText('Đơn đang xử lý')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: /Dọn dẹp nhà theo giờ/ }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1', role: 'CLIENT' } });
  expect(screen.queryByText('Dịch vụ của tôi')).toBeNull();
});

test('provider shortcuts appear only for providers', async () => {
  setup({ status: 'signedIn', scope: 'ROLE_CLIENT ROLE_PROVIDER' });
  await render(<HomeScreen />);
  expect(screen.getByText('Dịch vụ của tôi')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Đơn nhận' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/orders', params: expect.objectContaining({ role: 'PROVIDER' }) });
});

test('rails render and "Xem tất cả" opens Explore with the rail filter', async () => {
  setup();
  await render(<HomeScreen />);
  expect(screen.getByText('Phổ biến nhất')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Xem tất cả Thợ tận nhà' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/explore', params: expect.objectContaining({ executionType: 'ONSITE' }) });
});
