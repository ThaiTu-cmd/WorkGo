import { Client } from '@stomp/stompjs';
import axiosClient, { getAccessToken } from './axiosClient';
import { decodeToken } from '../utils/jwt';

// Client ↔ provider messaging over communication-service
// (/api/v1/communication). REST does every write; a STOMP WebSocket pushes new
// messages, and polling covers what the socket does not carry (new threads
// started by the other side, read receipts) or a dropped connection.
//
// Store shape (what useMessages() returns):
//   { userId, status: 'idle'|'loading'|'ready'|'error', error,
//     conversations: Conversation[], messages: ChatMessage[], hasOlder: { [conversationId]: boolean } }
//   Conversation { id, participantId (user id), participantName|null, participantRole|null,
//                  context?, lastMessageAt, unreadCount }
//   ChatMessage  { id, conversationId, senderId: 'me'|userId, text, createdAt,
//                  read (I have read it), seen? (the counterpart has read my message),
//                  pending?, failed?, clientMessageId? }
//
// The backend only keeps user ids, so the counterpart's name/role and the
// service/order a thread was opened from are remembered locally per user.

export const ME = 'me';
const BASE = '/communication';
const LIST_SIZE = 50;
const PAGE_SIZE = 30;
const PREVIEW_LIMIT = 20;
const LIST_POLL_MS = 30_000;
const THREAD_POLL_MS = 10_000;
const RECONNECT_MS = 5_000;
const HEARTBEAT_MS = 10_000;

const EMPTY = Object.freeze({
  userId: null,
  status: 'idle',
  error: null,
  conversations: [],
  messages: [],
  hasOlder: {},
});

// ---------------------------------------------------------------- errors

// communication-service error codes → messages the user can act on.
const ERROR_MESSAGES = {
  1008: 'Dữ liệu tin nhắn không hợp lệ.',
  4001: 'Không tìm thấy cuộc trò chuyện.',
  4002: 'Bạn không thuộc cuộc trò chuyện này.',
  4003: 'Cuộc trò chuyện đã đóng, không gửi thêm được tin nhắn.',
  4004: 'Bạn không thể nhắn tin cho chính mình.',
  4005: 'Không mở được cuộc trò chuyện cho nội dung này.',
  4006: 'Không tìm thấy tin nhắn.',
  4007: 'Tin nhắn không được để trống.',
  4008: 'Tệp đính kèm không hợp lệ hoặc quá lớn.',
  4011: 'Tin nhắn này đã được gửi với nội dung khác.',
  4012: 'Bạn gửi tin nhắn quá nhanh, vui lòng chờ một chút rồi thử lại.',
};
const NO_PARTICIPANT = 'Không xác định được người nhận tin nhắn.';
const SERVICE_UNAVAILABLE = 'Máy chủ tin nhắn đang tạm thời không sẵn sàng. Vui lòng thử lại sau.';

export const messageErrorMessage = (err) =>
  ERROR_MESSAGES[err?.code] ||
  (err?.status === 503 ? SERVICE_UNAVAILABLE : '') ||
  err?.message ||
  'Không thực hiện được thao tác. Vui lòng thử lại.';

// ---------------------------------------------------------------- store

let state = EMPTY;
const listeners = new Set();
let loadedPages = {}; // conversationId → pages of history loaded
const markingRead = new Set(); // message ids with a read request in flight

const emit = (next) => {
  state = next;
  listeners.forEach((l) => l());
};
const patch = (fields) => emit({ ...state, ...fields });

const currentUserId = () => {
  const claims = decodeToken(getAccessToken());
  return claims?.userId ? String(claims.userId) : null;
};

export const getSnapshot = () => state;
export const getServerSnapshot = () => EMPTY;

// ------------------------------------------------- local memory per user

const readJson = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
};
const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: names fall back to "User #id" */
  }
};
const peersKey = (me) => `workgo_chat_peers:${me}`;
const contextsKey = (me) => `workgo_chat_contexts:${me}`;

function rememberPeer(me, userId, name, role) {
  if (!name && !role) return;
  const peers = readJson(peersKey(me));
  peers[userId] = { name: name || peers[userId]?.name || null, role: role || peers[userId]?.role || null };
  writeJson(peersKey(me), peers);
}

function rememberContext(me, conversationId, context) {
  if (!context) return;
  const contexts = readJson(contextsKey(me));
  contexts[conversationId] = context;
  writeJson(contextsKey(me), contexts);
}

// ---------------------------------------------------------------- mapping

function toConversation(dto, me, peers, contexts) {
  const peer = (dto.participants || []).find((p) => String(p.userId) !== me);
  const participantId = peer ? String(peer.userId) : '';
  const info = peers[participantId] || {};
  return {
    id: String(dto.id),
    participantId,
    participantName: info.name || null,
    participantRole: info.role || null,
    context: contexts[dto.id] || undefined,
    lastMessageAt: dto.lastMessageAt || dto.createdAt,
    hasMessages: Boolean(dto.lastMessageAt),
    unreadCount: Number(dto.unreadCount) || 0,
  };
}

function toMessage(dto, me) {
  const mine = String(dto.senderId) === me;
  return {
    id: String(dto.id),
    conversationId: String(dto.conversationId),
    senderId: mine ? ME : String(dto.senderId),
    text: dto.content || '',
    createdAt: dto.sentAt,
    read: mine || Boolean(dto.readAt),
    seen: mine ? Boolean(dto.readAt) : undefined,
  };
}

// Server copies replace local ones with the same id. Read state only moves
// forward, so a poll that started before a read request landed cannot undo it.
function mergeMessages(list, incoming) {
  const byId = new Map(list.map((m) => [m.id, m]));
  for (const m of incoming) {
    const old = byId.get(m.id);
    byId.set(m.id, old ? { ...m, read: old.read || m.read, seen: m.seen === undefined ? undefined : old.seen || m.seen } : m);
  }
  return [...byId.values()];
}

const sameConversation = (a, b) =>
  a.lastMessageAt === b.lastMessageAt &&
  a.hasMessages === b.hasMessages &&
  a.unreadCount === b.unreadCount &&
  a.participantName === b.participantName &&
  a.participantRole === b.participantRole &&
  a.context === b.context;

// ---------------------------------------------------------------- REST

async function fetchConversations() {
  const me = state.userId;
  const res = await axiosClient.get(`${BASE}/conversations`, { params: { page: 0, size: LIST_SIZE } });
  if (me !== state.userId) return; // signed out / switched user meanwhile
  const peers = readJson(peersKey(me));
  const contexts = readJson(contextsKey(me));
  const fresh = (res?.result?.data || []).map((dto) => toConversation(dto, me, peers, contexts));
  const before = new Map(state.conversations.map((c) => [c.id, c]));
  const conversations = fresh.map((c) => {
    const old = before.get(c.id);
    return old && sameConversation(old, c) ? old : c;
  });
  patch({ conversations, status: 'ready', error: null });
  conversations.forEach((c) => subscribeTopic(c.id));
  prefetchPreviews(conversations);
}

// The list API has no last-message text, so fetch the newest message of the
// top threads whose latest activity is not loaded yet.
function prefetchPreviews(conversations) {
  const newestLoaded = new Map();
  for (const m of state.messages) {
    if (m.pending) continue;
    const prev = newestLoaded.get(m.conversationId);
    if (!prev || prev < m.createdAt) newestLoaded.set(m.conversationId, m.createdAt);
  }
  conversations
    .slice(0, PREVIEW_LIMIT)
    .filter((c) => c.lastMessageAt && (newestLoaded.get(c.id) || '') < c.lastMessageAt)
    .forEach((c) => fetchPage(c.id, 0, 1).catch(() => {}));
}

async function fetchPage(conversationId, page, size = PAGE_SIZE) {
  const me = state.userId;
  const res = await axiosClient.get(`${BASE}/conversations/${conversationId}/messages`, {
    params: { page, size },
  });
  if (me !== state.userId) return null;
  const result = res?.result;
  const incoming = (result?.data || []).map((dto) => toMessage(dto, me));
  patch({ messages: mergeMessages(state.messages, incoming) });
  return result;
}

async function refreshThread(conversationId) {
  const result = await fetchPage(conversationId, 0);
  if (!result) return;
  if (!loadedPages[conversationId]) loadedPages[conversationId] = 1;
  const hasOlder = loadedPages[conversationId] < (result.totalPages || 0);
  if (state.hasOlder[conversationId] !== hasOlder) {
    patch({ hasOlder: { ...state.hasOlder, [conversationId]: hasOlder } });
  }
}

function upsertConversation(conversation) {
  const exists = state.conversations.some((c) => c.id === conversation.id);
  patch({
    conversations: exists
      ? state.conversations.map((c) => (c.id === conversation.id ? { ...c, ...conversation } : c))
      : [conversation, ...state.conversations],
  });
}

// ---------------------------------------------------------------- realtime

let client = null;
const topics = new Map(); // conversationId → STOMP subscription

function wsUrl() {
  const override = process.env.NEXT_PUBLIC_COMMUNICATION_WS_URL;
  if (override) return override;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/api/v1/communication/ws`;
}

function subscribeTopic(conversationId) {
  if (!client?.connected || topics.has(conversationId)) return;
  const sub = client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
    try {
      receive(JSON.parse(frame.body));
    } catch {
      /* malformed frame: the next poll catches up */
    }
  });
  topics.set(conversationId, sub);
}

function receive(dto) {
  const me = state.userId;
  if (!me || !dto?.id) return;
  const message = toMessage(dto, me);
  // My own send echoed back while its POST is still pending: the POST
  // response swaps the bubble, so skip the echo instead of showing it twice.
  const echo = state.messages.some(
    (m) => m.pending && m.conversationId === message.conversationId && message.senderId === ME && m.text === message.text,
  );
  if (echo) return;
  const known = state.messages.some((m) => m.id === message.id);
  const conversation = state.conversations.find((c) => c.id === message.conversationId);
  if (!conversation) {
    fetchConversations().catch(() => {});
    return;
  }
  const lastMessageAt =
    conversation.lastMessageAt && conversation.lastMessageAt > message.createdAt
      ? conversation.lastMessageAt
      : message.createdAt;
  const unreadCount = conversation.unreadCount + (!known && !message.read ? 1 : 0);
  emit({
    ...state,
    messages: mergeMessages(state.messages, [message]),
    conversations: state.conversations.map((c) =>
      c.id === conversation.id ? { ...c, lastMessageAt, unreadCount, hasMessages: true } : c,
    ),
  });
}

function connect() {
  if (client || typeof window === 'undefined') return;
  const stomp = new Client({
    brokerURL: wsUrl(),
    reconnectDelay: RECONNECT_MS,
    heartbeatIncoming: HEARTBEAT_MS,
    heartbeatOutgoing: HEARTBEAT_MS,
    // Runs before every (re)connect, so a refreshed token is picked up.
    beforeConnect: () => {
      const token = getAccessToken();
      stomp.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    onConnect: () => {
      if (client !== stomp) return; // replaced after a sign-out/switch
      topics.clear();
      state.conversations.forEach((c) => subscribeTopic(c.id));
      // Catch up on what arrived while the socket was down.
      fetchConversations().catch(() => {});
      if (activeId) refreshThread(activeId).catch(() => {});
    },
    onWebSocketClose: () => {
      if (client === stomp) topics.clear();
    },
  });
  client = stomp;
  stomp.activate();
}

function disconnect() {
  const c = client;
  client = null;
  topics.clear();
  if (c) c.deactivate().catch(() => {});
}

// ---------------------------------------------------------------- lifecycle

let listTimer = null;
let threadTimer = null;
let activeId = null;

function start() {
  const me = currentUserId();
  if (!me) {
    if (state !== EMPTY) emit(EMPTY);
    return;
  }
  if (state.userId !== me) {
    loadedPages = {};
    markingRead.clear();
    emit({ ...EMPTY, userId: me, status: 'loading' });
  }
  loadConversations();
  if (!listTimer) listTimer = setInterval(() => fetchConversations().catch(() => {}), LIST_POLL_MS);
  connect();
}

function stop() {
  clearInterval(listTimer);
  listTimer = null;
  clearInterval(threadTimer);
  threadTimer = null;
  disconnect();
}

function onAuthChanged() {
  if (currentUserId() === state.userId) return;
  stop();
  if (listeners.size > 0) start();
}

export const subscribe = (onChange) => {
  listeners.add(onChange);
  if (listeners.size === 1) {
    window.addEventListener('workgo-auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    queueMicrotask(() => {
      if (listeners.size > 0 && !listTimer) start();
    });
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener('workgo-auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
      stop();
    }
  };
};

function loadConversations() {
  return fetchConversations().catch((err) => {
    // Keep showing what is already loaded; only an empty store shows the error.
    if (state.conversations.length === 0) patch({ status: 'error', error: messageErrorMessage(err) });
  });
}

// ---------------------------------------------------------------- selectors

export const unreadOf = (s, conversationId) =>
  s.conversations.find((c) => c.id === conversationId)?.unreadCount || 0;

export const totalUnread = (s) => s.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

// ---------------------------------------------------------------- actions

export const messageApi = {
  reload: loadConversations,

  // target: { participantId? (user id), providerId? (provider profile id),
  //           participantName, participantRole, context? }
  // Resolves to the conversation id (an existing thread is reused).
  async openConversation(target) {
    const me = state.userId || currentUserId();
    let userId = target?.participantId ? String(target.participantId) : null;
    if (!userId && target?.providerId) {
      const res = await axiosClient.get(`/identity/providers/${target.providerId}`);
      userId = res?.result?.userId ? String(res.result.userId) : null;
    }
    if (!me || !userId) throw new Error(NO_PARTICIPANT);
    // Scoped contexts (SERVICE/ORDER…) are not verifiable by the backend yet,
    // so every thread is GENERAL and the context is kept on this device.
    const res = await axiosClient.post(`${BASE}/conversations`, { participantId: userId, contextType: 'GENERAL' });
    const dto = res?.result;
    if (!dto?.id) throw new Error(NO_PARTICIPANT);
    rememberPeer(me, userId, target.participantName, target.participantRole);
    rememberContext(me, String(dto.id), target.context);
    if (me === state.userId) {
      upsertConversation(toConversation(dto, me, readJson(peersKey(me)), readJson(contextsKey(me))));
      subscribeTopic(String(dto.id));
    }
    return String(dto.id);
  },

  // Keeps one thread fresh while it is on screen. Returns the cleanup.
  watchConversation(conversationId) {
    activeId = conversationId;
    refreshThread(conversationId).catch(() => {});
    clearInterval(threadTimer);
    threadTimer = setInterval(() => refreshThread(conversationId).catch(() => {}), THREAD_POLL_MS);
    return () => {
      if (activeId !== conversationId) return;
      activeId = null;
      clearInterval(threadTimer);
      threadTimer = null;
    };
  },

  async loadOlder(conversationId) {
    const page = loadedPages[conversationId] || 1;
    const result = await fetchPage(conversationId, page);
    if (!result) return;
    loadedPages[conversationId] = page + 1;
    patch({ hasOlder: { ...state.hasOlder, [conversationId]: page + 1 < (result.totalPages || 0) } });
  },

  // Optimistic: the bubble shows at once and turns into the server copy (or a
  // failed bubble that can be resent with the same clientMessageId).
  async sendMessage(conversationId, text, clientMessageId = newId()) {
    const localId = `local-${clientMessageId}`;
    const draft = {
      id: localId,
      conversationId,
      senderId: ME,
      text,
      createdAt: new Date().toISOString(),
      read: true,
      seen: false,
      pending: true,
      clientMessageId,
    };
    patch({ messages: [...state.messages.filter((m) => m.id !== localId), draft] });
    try {
      const res = await axiosClient.post(`${BASE}/conversations/${conversationId}/messages`, {
        content: text,
        clientMessageId,
      });
      const saved = toMessage(res.result, state.userId);
      emit({
        ...state,
        messages: mergeMessages(
          state.messages.filter((m) => m.id !== localId),
          [saved],
        ),
        conversations: state.conversations.map((c) =>
          c.id === conversationId && (!c.hasMessages || c.lastMessageAt < saved.createdAt)
            ? { ...c, lastMessageAt: saved.createdAt, hasMessages: true }
            : c,
        ),
      });
      return { ok: true };
    } catch (err) {
      patch({
        messages: state.messages.map((m) => (m.id === localId ? { ...m, pending: false, failed: true } : m)),
      });
      return { ok: false, error: messageErrorMessage(err) };
    }
  },

  resendMessage(message) {
    return messageApi.sendMessage(message.conversationId, message.text, message.clientMessageId);
  },

  // The backend marks one message at a time; mark every loaded unread one.
  async markRead(conversationId) {
    const unread = state.messages.filter(
      (m) => m.conversationId === conversationId && m.senderId !== ME && !m.read && !markingRead.has(m.id),
    );
    if (unread.length === 0) return;
    const ids = new Set(unread.map((m) => m.id));
    ids.forEach((id) => markingRead.add(id));
    emit({
      ...state,
      messages: state.messages.map((m) => (ids.has(m.id) ? { ...m, read: true } : m)),
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: Math.max(0, c.unreadCount - ids.size) } : c,
      ),
    });
    await Promise.allSettled([...ids].map((id) => axiosClient.post(`${BASE}/messages/${id}/read`)));
    ids.forEach((id) => markingRead.delete(id));
  },
};
