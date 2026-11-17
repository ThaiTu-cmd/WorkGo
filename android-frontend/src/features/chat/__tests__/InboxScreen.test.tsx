import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InboxScreen } from '../InboxScreen';
import { communicationApi } from '@/api/communicationApi';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ claims: { userId: 'u1' } }) }));
jest.mock('@/api/communicationApi', () => ({ communicationApi: { getConversations: jest.fn() } }));
test('conversation list opens the server conversation ID', async () => {
  (communicationApi.getConversations as jest.Mock).mockResolvedValue({ result: { data: [{ id: 'c99', contextType: 'ORDER', contextId: 'o1', unreadCount: 2 }] } });
  await render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><InboxScreen /></QueryClientProvider>);
  await fireEvent.press(await screen.findByText('ORDER #o1'));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'c99' } }));
});
