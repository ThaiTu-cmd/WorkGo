import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

beforeEach(() => {
  jest.clearAllMocks();
  Object.values(communicationApi).forEach(fn => (fn as jest.Mock).mockReset());
  (communicationApi.markMessageRead as jest.Mock).mockResolvedValue({ result: {} });
});

test('marks incoming unread messages read but does not mark the current user messages', async () => {
  (communicationApi.getMessages as jest.Mock).mockResolvedValue({ result: { data: [
    { id: 'incoming', senderId: 'u2', content: 'Hello', sentAt: '2026-11-17T09:00:00Z', readAt: null },
    { id: 'mine', senderId: 'u1', content: 'Mine', sentAt: '2026-11-17T09:01:00Z', readAt: null },
  ] } });
  await renderWithClient(<ChatScreen conversationId="c1" />);
  await waitFor(() => expect(communicationApi.markMessageRead).toHaveBeenCalledWith('incoming'));
  expect(communicationApi.markMessageRead).toHaveBeenCalledTimes(1);
});

test('retry after a lost send response keeps the original clientMessageId', async () => {
  (communicationApi.getMessages as jest.Mock).mockResolvedValue({ result: { data: [] } });
  (communicationApi.sendMessage as jest.Mock).mockRejectedValueOnce(new Error('Network failed')).mockResolvedValueOnce({ result: { id: 'm1' } });
  await renderWithClient(<ChatScreen conversationId="c1" />);
  await fireEvent.changeText(screen.getByPlaceholderText('Nhập tin nhắn...'), 'hello');
  await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));
  expect(await screen.findByText('Không thể gửi tin nhắn')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Gửi' }));
  await waitFor(() => expect(communicationApi.sendMessage).toHaveBeenCalledTimes(2));
  const calls = (communicationApi.sendMessage as jest.Mock).mock.calls;
  expect(calls[0][1].clientMessageId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(calls[1][1].clientMessageId).toBe(calls[0][1].clientMessageId);
  await waitFor(() => expect(screen.getByPlaceholderText('Nhập tin nhắn...').props.value).toBe(''));
});

test('new contact uses the released GENERAL conversation contract', async () => {
  (communicationApi.getConversations as jest.Mock).mockResolvedValue({ result: { data: [] } });
  (communicationApi.createConversation as jest.Mock).mockResolvedValue({ result: { id: 'general-1' } });
  (communicationApi.getMessages as jest.Mock).mockResolvedValue({ result: { data: [] } });
  (communicationApi.sendMessage as jest.Mock).mockResolvedValue({ result: { id: 'sent' } });
  await renderWithClient(<ChatScreen participantId="u2" contextType="ORDER" contextId="o1" />);
  await waitFor(() => expect(communicationApi.getMessages).toHaveBeenCalled());
  expect(communicationApi.createConversation).toHaveBeenCalledWith({ participantId: 'u2', contextType: 'GENERAL', contextId: null });
});

test('a failed read acknowledgment retries when an identical poll completes', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (communicationApi.getMessages as jest.Mock).mockResolvedValue({ result: { data: [{ id: 'm1', senderId: 'u2', content: 'unread', sentAt: '2026-11-17T09:00:00Z', readAt: null }] } });
  (communicationApi.markMessageRead as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ result: {} });
  await render(<QueryClientProvider client={client}><ChatScreen conversationId="c1" /></QueryClientProvider>);
  await waitFor(() => expect(communicationApi.markMessageRead).toHaveBeenCalledTimes(1));
  await act(async () => { await client.invalidateQueries({ queryKey: ['messages', 'c1'] }); });
  await waitFor(() => expect(communicationApi.markMessageRead).toHaveBeenCalledTimes(2));
});

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
