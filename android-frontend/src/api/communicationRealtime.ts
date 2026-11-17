import type { QueryClient } from '@tanstack/react-query';
import { Client, type StompSubscription } from '@stomp/stompjs';
import { API_BASE_URL } from '@/lib/env';

export function createCommunicationRealtime(queries: QueryClient, userId: string, token: string) {
  const watchers = new Map<string, number>();
  const subscriptions = new Map<string, StompSubscription>();
  let active = false;
  const invalidate = (queryKey: readonly string[]) => {
    if (active) void queries.invalidateQueries({ queryKey });
  };
  const sync = () => {
    if (!active || !socket.connected) return;
    // shortcut: default server allows 100 subscriptions; leave one for notifications and poll the rest.
    for (const id of watchers.keys()) {
      if (subscriptions.size >= 99) break;
      if (subscriptions.has(id)) continue;
      subscriptions.set(id, socket.subscribe(`/topic/conversations/${id}`, () => {
        invalidate(['messages', id, userId]);
        invalidate(['conversations', userId]);
      }));
    }
  };
  const socket = new Client({
    brokerURL: `${API_BASE_URL.replace(/^http/, 'ws')}/communication/ws`,
    connectHeaders: { Authorization: `Bearer ${token}` },
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    reconnectDelay: 5000,
    connectionTimeout: 10000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      if (!active) return;
      subscriptions.clear();
      socket.subscribe('/user/queue/notifications', () => invalidate(['notifications', userId]));
      sync();
      invalidate(['conversations', userId]);
      invalidate(['notifications', userId]);
      for (const id of watchers.keys()) invalidate(['messages', id, userId]);
    },
    onWebSocketClose: () => { subscriptions.clear(); },
  });
  return {
    start() { active = true; socket.activate(); },
    stop() { active = false; subscriptions.clear(); void socket.deactivate().catch(() => {}); },
    watch(ids: readonly string[]) {
      const unique = [...new Set(ids)];
      for (const id of unique) watchers.set(id, (watchers.get(id) ?? 0) + 1);
      sync();
      return () => {
        for (const id of unique) {
          const remaining = (watchers.get(id) ?? 1) - 1;
          if (remaining > 0) watchers.set(id, remaining);
          else {
            watchers.delete(id);
            if (socket.connected) subscriptions.get(id)?.unsubscribe();
            subscriptions.delete(id);
          }
        }
        sync();
      };
    },
  };
}
