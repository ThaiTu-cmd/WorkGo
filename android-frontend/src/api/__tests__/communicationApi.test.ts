import { http } from '../client';
import { communicationApi } from '../communicationApi';

jest.mock('../client', () => ({ http: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('getConversations calls /communication/conversations', async () => {
  (http.get as jest.Mock).mockResolvedValueOnce({ result: { data: [] } });
  await communicationApi.getConversations(0, 10);
  expect(http.get).toHaveBeenCalledWith('/communication/conversations', { params: { page: 0, size: 10 } });
});

test('createConversation posts to /communication/conversations', async () => {
  (http.post as jest.Mock).mockResolvedValueOnce({ result: { id: 'c1' } });
  const res = await communicationApi.createConversation({
    participantId: 'u2',
    contextType: 'ORDER',
    contextId: 'o1',
  });
  expect(http.post).toHaveBeenCalledWith('/communication/conversations', {
    participantId: 'u2',
    contextType: 'ORDER',
    contextId: 'o1',
  });
  expect(res.result.id).toBe('c1');
});

test('getMessages calls /communication/conversations/:id/messages', async () => {
  (http.get as jest.Mock).mockResolvedValueOnce({ result: { data: [] } });
  await communicationApi.getMessages('c1', 0, 30);
  expect(http.get).toHaveBeenCalledWith('/communication/conversations/c1/messages', { params: { page: 0, size: 30 } });
});

test('sendMessage posts to /communication/conversations/:id/messages', async () => {
  (http.post as jest.Mock).mockResolvedValueOnce({ result: { id: 'm1' } });
  await communicationApi.sendMessage('c1', {
    content: 'Xin chào',
    clientMessageId: 'cm1',
  });
  expect(http.post).toHaveBeenCalledWith('/communication/conversations/c1/messages', {
    content: 'Xin chào',
    clientMessageId: 'cm1',
  });
});
