import { Client, type StompConfig } from '@stomp/stompjs';
import { QueryClient } from '@tanstack/react-query';
import { createCommunicationRealtime } from '../communicationRealtime';

jest.mock('@stomp/stompjs', () => ({ Client: jest.fn() }));

let config: StompConfig;
let callbacks: Map<string, () => void>;
let unsubscribers: Map<string, jest.Mock>;
let socket: { connected: boolean; activate: jest.Mock; deactivate: jest.Mock; subscribe: jest.Mock };
let queries: QueryClient;
let invalidate: jest.SpyInstance;
beforeEach(() => {
  config = {};
  callbacks = new Map();
  unsubscribers = new Map();
  socket = {
    connected: true, activate: jest.fn(), deactivate: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn((destination, receive) => {
      callbacks.set(destination, receive);
      const unsubscribe = jest.fn();
      unsubscribers.set(destination, unsubscribe);
      return { unsubscribe };
    }),
  };
  (Client as jest.Mock).mockImplementation(options => { config = options; return socket; });
  queries = new QueryClient();
  invalidate = jest.spyOn(queries, 'invalidateQueries').mockResolvedValue(undefined);
});
function connected() { config.onConnect?.call(socket as unknown as Client, {} as never); }

test('authenticates on STOMP CONNECT and supports native binary frames without a token in the URL', () => {
  const live = createCommunicationRealtime(queries, 'u1', 'private-token');
  live.start();
  expect(Client).toHaveBeenCalledWith(expect.objectContaining({
    brokerURL: 'ws://10.0.2.2:8888/api/v1/communication/ws',
    connectHeaders: { Authorization: 'Bearer private-token' },
    forceBinaryWSFrames: true,
  }));
  expect(socket.activate).toHaveBeenCalledTimes(1);
});

test('message and notification events refetch scoped server data without replaying a send', () => {
  const live = createCommunicationRealtime(queries, 'u1', 'token');
  live.watch(['c1', 'c1']);
  live.start(); connected(); invalidate.mockClear();
  callbacks.get('/topic/conversations/c1')?.();
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['messages', 'c1', 'u1'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['conversations', 'u1'] });
  callbacks.get('/user/queue/notifications')?.();
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications', 'u1'] });
  expect(socket.subscribe.mock.calls.filter(([path]) => path === '/topic/conversations/c1')).toHaveLength(1);
});

test('reconnect subscribes again and catches up messages missed while disconnected', () => {
  const live = createCommunicationRealtime(queries, 'u1', 'token');
  live.watch(['c1']); live.start(); connected();
  config.onWebSocketClose?.call(socket as unknown as Client, {} as never);
  invalidate.mockClear(); connected();
  expect(socket.subscribe.mock.calls.filter(([path]) => path === '/topic/conversations/c1')).toHaveLength(2);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['messages', 'c1', 'u1'] });
});

test('shared watchers unsubscribe only after the last screen releases the conversation', () => {
  const live = createCommunicationRealtime(queries, 'u1', 'token');
  const first = live.watch(['c1']); const second = live.watch(['c1']);
  live.start(); connected();
  first(); expect(unsubscribers.get('/topic/conversations/c1')).not.toHaveBeenCalled();
  second(); expect(unsubscribers.get('/topic/conversations/c1')).toHaveBeenCalledTimes(1);
});

test('logout stops reconnect and ignores late frames or CONNECT from the old session', () => {
  const live = createCommunicationRealtime(queries, 'u1', 'old-token');
  live.watch(['c1']); live.start(); connected();
  const oldFrame = callbacks.get('/topic/conversations/c1');
  live.stop(); invalidate.mockClear(); socket.subscribe.mockClear();
  oldFrame?.(); connected();
  expect(socket.deactivate).toHaveBeenCalledTimes(1);
  expect(invalidate).not.toHaveBeenCalled();
  expect(socket.subscribe).not.toHaveBeenCalled();
});
