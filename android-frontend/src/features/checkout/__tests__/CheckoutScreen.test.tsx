import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { addressApi } from '@/api/addressApi';
import { availabilityApi } from '@/api/availabilityApi';
import { ApiError } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { useServiceDetail } from '@/features/catalog/hooks';

import { CheckoutScreen } from '../CheckoutScreen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ serviceId: 's1', packageId: 'pk1' }),
}));
jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/features/catalog/hooks', () => ({ useServiceDetail: jest.fn() }));
jest.mock('@/api/orderApi', () => ({ orderApi: { createOrder: jest.fn() } }));
jest.mock('@/api/availabilityApi', () => ({ availabilityApi: { getSlots: jest.fn() } }));
jest.mock('@/api/addressApi', () => ({ addressApi: { getMy: jest.fn() } }));

const detail = (executionType: 'DIGITAL' | 'ONSITE') => ({
  isPending: false,
  isError: false,
  data: {
    serviceId: 's1',
    title: 'Thiết kế logo',
    executionType,
    packages: [{ id: 'pk1', tier: 'BASIC', name: 'Cơ bản', description: '', price: 500000, deliveryDays: 3, durationMinute: null, revisionLimit: 2 }],
    addons: [{ id: 'a1', name: 'Giao gấp', description: '', price: 100000 }],
  },
});

function renderCheckout() {
  // gcTime Infinity: no garbage-collection timers left running after the test.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <CheckoutScreen />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (availabilityApi.getSlots as jest.Mock).mockResolvedValue({ result: { data: [] } });
  (addressApi.getMy as jest.Mock).mockResolvedValue({ result: { data: [] } });
});

test('shows the estimate for package + selected add-on', async () => {
  (useServiceDetail as jest.Mock).mockReturnValue(detail('DIGITAL'));
  await renderCheckout();
  expect(screen.getByTestId('checkout-total')).toHaveTextContent('500.000 ₫');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Giao gấp' }));
  expect(screen.getByTestId('checkout-total')).toHaveTextContent('600.000 ₫');
});

test('on success navigates to /orders/<orderId>', async () => {
  (useServiceDetail as jest.Mock).mockReturnValue(detail('DIGITAL'));
  (orderApi.createOrder as jest.Mock).mockResolvedValue({ result: { orderId: 'o9' } });
  await renderCheckout();
  await fireEvent.press(screen.getByRole('button', { name: 'Đặt dịch vụ' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o9', role: 'CLIENT' } }));
  expect(orderApi.createOrder).toHaveBeenCalledWith({ serviceId: 's1', packageId: 'pk1', addonIds: [] });
});

test('ONSITE without slots shows the reason and never calls createOrder', async () => {
  (useServiceDetail as jest.Mock).mockReturnValue(detail('ONSITE'));
  await renderCheckout();
  expect(await screen.findByText('Dịch vụ chưa có lịch trống. Vui lòng quay lại sau.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Đặt dịch vụ' })).toBeDisabled();
  expect(orderApi.createOrder).not.toHaveBeenCalled();
});

test('server error is shown and the user stays on checkout', async () => {
  (useServiceDetail as jest.Mock).mockReturnValue(detail('DIGITAL'));
  (orderApi.createOrder as jest.Mock).mockRejectedValue(new ApiError(400, { code: 2001, message: 'Gói không còn hoạt động' }));
  await renderCheckout();
  await fireEvent.press(screen.getByRole('button', { name: 'Đặt dịch vụ' }));
  expect(await screen.findByText('Gói không còn hoạt động')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});
