import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { communicationApi } from '@/api/communicationApi';
import { ChatScreen } from '../ChatScreen';

jest.mock('@/api/communicationApi', () => ({
  communicationApi: {
    getConversations: jest.fn(),
    createConversation: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    markMessageRead: jest.fn(),
  },
}));

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({
    claims: { userId: 'u1', userName: 'testuser' },
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('renders empty message state when no messages', async () => {
  (communicationApi.getMessages as jest.Mock).mockResolvedValueOnce({
    result: { data: [] },
  });

  await renderWithClient(<ChatScreen conversationId="c1" participantName="Thợ Điện Nước" />);

  expect(await screen.findByText('Thợ Điện Nước')).toBeTruthy();
  expect(await screen.findByText('Chưa có tin nhắn nào. Hãy gửi lời chào!')).toBeTruthy();
});

test('renders message list and sends message', async () => {
  (communicationApi.getMessages as jest.Mock).mockResolvedValueOnce({
    result: {
      data: [
        {
          id: 'm1',
          conversationId: 'c1',
          senderId: 'u2',
          content: 'Chào bạn, tôi sẽ đến lúc 9h',
          sentAt: '2026-11-17T09:00:00Z',
        },
      ],
    },
  });
  (communicationApi.sendMessage as jest.Mock).mockResolvedValueOnce({
    result: { id: 'm2' },
  });

  await renderWithClient(<ChatScreen conversationId="c1" participantName="Thợ Điện Nước" />);

  expect(await screen.findByText('Chào bạn, tôi sẽ đến lúc 9h')).toBeTruthy();

  const input = screen.getByPlaceholderText('Nhập tin nhắn...');
  await fireEvent.changeText(input, 'Vâng, cảm ơn bạn!');

  const sendBtn = screen.getByRole('button', { name: 'Gửi' });
  await fireEvent.press(sendBtn);

  await waitFor(() => {
    expect(communicationApi.sendMessage).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        content: 'Vâng, cảm ơn bạn!',
      })
    );
  });
});
