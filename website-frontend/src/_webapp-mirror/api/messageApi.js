import { getAccessToken } from './axiosClient';
import { decodeToken } from '../utils/jwt';

// Client ↔ provider messaging. There is no messaging service behind the
// gateway yet, so conversations live in localStorage, one store per signed-in
// user. Each mutation notes the REST call it stands in for; swapping these to
// axiosClient later keeps the shape the UI reads.
//
// Store shape: { conversations: Conversation[], messages: ChatMessage[] }
//   Conversation { id, participantId, participantName, participantRole: 'CLIENT'|'PROVIDER',
//                  context?: { type: 'service'|'order', id, title, label?, status? }, lastMessageAt }
//   ChatMessage  { id, conversationId, senderId: 'me'|participantId, text,
//                  attachments?: string[], createdAt,
//                  read (I have read it), seen? (the counterpart has read my message) }

export const ME = 'me';
const CHANGE_EVENT = 'workgo-messages-changed';
const EMPTY = Object.freeze({ conversations: [], messages: [] });

const storageKey = () => `workgo_messages:${decodeToken(getAccessToken())?.sub || 'guest'}`;
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

// Demo threads shown until the user's first change is persisted.
const buildSeed = () => {
  const conversations = [
    {
      id: 'conv-seed-1',
      participantId: 'seed-provider-1',
      participantName: 'Nguyễn Minh Anh',
      participantRole: 'PROVIDER',
      context: { type: 'service', id: null, title: 'Thiết kế logo & bộ nhận diện thương hiệu' },
      lastMessageAt: minutesAgo(12),
    },
    {
      id: 'conv-seed-2',
      participantId: 'seed-provider-2',
      participantName: 'Trần Quốc Bảo',
      participantRole: 'PROVIDER',
      context: { type: 'order', id: null, title: 'Sửa máy lạnh tại nhà', label: 'ORD-1042', status: 'IN_PROGRESS' },
      lastMessageAt: minutesAgo(60 * 5),
    },
    {
      id: 'conv-seed-3',
      participantId: 'seed-client-1',
      participantName: 'Lê Thu Hà',
      participantRole: 'CLIENT',
      lastMessageAt: minutesAgo(60 * 26),
    },
  ];
  const m = (conversationId, senderId, text, ago, read = true) => ({
    id: newId('msg'),
    conversationId,
    senderId,
    text,
    createdAt: minutesAgo(ago),
    read,
    seen: senderId === ME ? true : undefined,
  });
  const messages = [
    m('conv-seed-1', ME, 'Chào bạn, mình cần logo cho quán cà phê nhỏ, phong cách tối giản.', 40),
    m('conv-seed-1', 'seed-provider-1', 'Chào bạn! Bạn có sẵn tên quán và màu chủ đạo mong muốn chưa?', 30),
    m('conv-seed-1', 'seed-provider-1', 'Mình có thể gửi 3 phương án phác thảo trong 2 ngày nhé.', 12, false),
    m('conv-seed-2', 'seed-provider-2', 'Mình sẽ đến lúc 14h chiều nay, bạn để ý điện thoại giúp mình.', 60 * 6),
    m('conv-seed-2', ME, 'Ok anh, em ở nhà cả chiều.', 60 * 5),
    m('conv-seed-3', 'seed-client-1', 'Chị muốn hỏi gói Tiêu chuẩn có bao gồm chỉnh sửa không em?', 60 * 26, false),
  ];
  return { conversations, messages };
};

// useSyncExternalStore needs a stable snapshot: re-parse only when the raw
// string (or the signed-in user) changes.
let cache = { key: null, raw: undefined, value: EMPTY };

export const getSnapshot = () => {
  if (typeof window === 'undefined') return EMPTY;
  const key = storageKey();
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    /* storage blocked: fall back to the in-memory cache */
    if (cache.key === key) return cache.value;
  }
  if (cache.key === key && cache.raw === raw) return cache.value;
  let value = null;
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.conversations) && Array.isArray(parsed?.messages)) value = parsed;
    } catch {
      /* corrupt entry: reseed below */
    }
  }
  cache = { key, raw, value: value || buildSeed() };
  return cache.value;
};

export const getServerSnapshot = () => EMPTY;

export const subscribe = (onChange) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  window.addEventListener('workgo-auth-changed', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
    window.removeEventListener('workgo-auth-changed', onChange);
  };
};

// Returns false when storage is full or blocked (the change is kept in memory).
const commit = (next) => {
  const key = storageKey();
  let ok = true;
  let raw = cache.raw;
  try {
    raw = JSON.stringify(next);
    window.localStorage.setItem(key, raw);
  } catch {
    ok = false;
  }
  cache = { key, raw, value: next };
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return ok;
};

export const unreadOf = (state, conversationId) =>
  state.messages.filter((x) => x.conversationId === conversationId && x.senderId !== ME && !x.read).length;

export const totalUnread = (state) => state.messages.filter((x) => x.senderId !== ME && !x.read).length;

export const messageApi = {
  // Future: POST /message/conversations { participantId, context } → existing or new thread.
  openConversation(participant, context) {
    const state = getSnapshot();
    const existing = state.conversations.find((c) => c.participantId === participant.participantId);
    if (existing) {
      if (context) {
        commit({
          ...state,
          conversations: state.conversations.map((c) => (c.id === existing.id ? { ...c, context } : c)),
        });
      }
      return existing.id;
    }
    const conversation = {
      id: newId('conv'),
      participantId: participant.participantId,
      participantName: participant.participantName,
      participantRole: participant.participantRole,
      context: context || undefined,
      lastMessageAt: new Date().toISOString(),
    };
    commit({ ...state, conversations: [conversation, ...state.conversations] });
    return conversation.id;
  },

  // Future: POST /message/conversations/{id}/messages
  sendMessage(conversationId, text, attachments = []) {
    return appendMessage(conversationId, ME, text, attachments);
  },

  // Mock only: the counterpart's reply. Reading it also marks my messages seen.
  receiveMessage(conversationId, senderId, text) {
    return appendMessage(conversationId, senderId, text, [], true);
  },

  // Future: POST /message/conversations/{id}/read
  markRead(conversationId) {
    const state = getSnapshot();
    if (unreadOf(state, conversationId) === 0) return true;
    return commit({
      ...state,
      messages: state.messages.map((x) =>
        x.conversationId === conversationId && x.senderId !== ME ? { ...x, read: true } : x,
      ),
    });
  },
};

function appendMessage(conversationId, senderId, text, attachments, seenByPeer = false) {
  const state = getSnapshot();
  const now = new Date().toISOString();
  const message = {
    id: newId('msg'),
    conversationId,
    senderId,
    text,
    attachments: attachments.length ? attachments : undefined,
    createdAt: now,
    read: senderId === ME,
  };
  const messages = seenByPeer
    ? state.messages.map((x) => (x.conversationId === conversationId && x.senderId === ME ? { ...x, seen: true } : x))
    : state.messages;
  const ok = commit({
    conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, lastMessageAt: now } : c)),
    messages: [...messages, message],
  });
  return { message, ok };
}
