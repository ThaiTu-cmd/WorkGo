import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationsScreen } from '../NotificationsScreen';
import { notificationApi } from '@/api/notificationApi';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ claims: { userId: 'u1' } }) }));
jest.mock('@/api/notificationApi', () => ({ notificationApi: { list: jest.fn(), markRead: jest.fn(), readAll: jest.fn() } }));
test('opening an unread Order notification marks it read and opens the server order ID', async () => {
  (notificationApi.list as jest.Mock).mockResolvedValue({ result: { data: [{ id: 'n1', title: 'Order ready', content: 'Delivered', readAt: null, referenceType: 'ORDER', referenceId: 'o1' }] } });
  (notificationApi.markRead as jest.Mock).mockResolvedValue({ result: { id: 'n1', readAt: '2026-11-17T00:00:00Z' } });
  await render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><NotificationsScreen /></QueryClientProvider>);
  await fireEvent.press(await screen.findByText('Order ready'));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1' } }));
  expect(notificationApi.markRead).toHaveBeenCalledWith('n1');
});
