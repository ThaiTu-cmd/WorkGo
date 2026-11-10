"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessagesSquare } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { messageApi, unreadOf, useMessages } from "../../webapp-bridge/backend";
import ChatWindow from "./ChatWindow";
import ConversationList from "./ConversationList";
import type { Conversation, ConversationView, MessageState } from "./types";
import styles from "./MessagesPage.module.css";

type Props = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  conversationId?: string;
};

const QUOTA_MESSAGE = "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — tin nhắn chỉ được giữ trong phiên này.";

// Mock counterpart replies until a real messaging service exists.
const REPLIES: Record<Conversation["participantRole"], string[]> = {
  PROVIDER: [
    "Cảm ơn bạn đã nhắn! Mình đã nhận được thông tin và sẽ phản hồi chi tiết ngay.",
    "Được bạn nhé. Bạn có thể gửi thêm ví dụ hoặc yêu cầu cụ thể để mình báo giá chính xác hơn không?",
    "Mình có thể bắt đầu trong hôm nay. Bạn chọn gói phù hợp rồi đặt đơn qua WorkGo để tiền được giữ an toàn trong Escrow nhé.",
  ],
  CLIENT: [
    "Ok bạn, mình đã xem rồi.",
    "Cảm ơn bạn, vậy mình chờ bản cập nhật nhé.",
    "Bạn cho mình hỏi thời gian hoàn thành dự kiến là khi nào?",
  ],
};

export default function MessagesPage({ onNavigate, onShowToast, conversationId }: Props) {
  const state = useMessages() as MessageState;
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  const conversations = useMemo<ConversationView[]>(() => {
    const lastById = new Map<string, MessageState["messages"][number]>();
    for (const m of state.messages) {
      const prev = lastById.get(m.conversationId);
      if (!prev || prev.createdAt <= m.createdAt) lastById.set(m.conversationId, m);
    }
    return state.conversations
      .map((c) => ({ ...c, lastMessage: lastById.get(c.id) ?? null, unread: unreadOf(state, c.id) }))
      .sort((a, b) => (b.lastMessage?.createdAt ?? b.lastMessageAt).localeCompare(a.lastMessage?.createdAt ?? a.lastMessageAt));
  }, [state]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const thread = useMemo(
    () =>
      state.messages
        .filter((m) => m.conversationId === activeId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state, activeId],
  );

  // Opening a thread (or a reply landing in the open one) marks it read.
  const activeUnread = active?.unread ?? 0;
  useEffect(() => {
    if (activeId && activeUnread > 0) messageApi.markRead(activeId);
  }, [activeId, activeUnread]);

  const send = (text: string, attachments: string[]) => {
    if (!active) return;
    const { ok } = messageApi.sendMessage(active.id, text, attachments);
    if (!ok) onShowToast(QUOTA_MESSAGE);
    const { id, participantId, participantRole } = active;
    const replies = REPLIES[participantRole];
    timers.current.push(
      setTimeout(() => setTypingId(id), 600),
      setTimeout(() => {
        setTypingId((cur) => (cur === id ? null : cur));
        messageApi.receiveMessage(id, participantId, replies[Math.floor(Math.random() * replies.length)]);
      }, 2200),
    );
  };

  const openContext = () => {
    const ctx = active?.context;
    if (!ctx) return;
    if (ctx.type === "order") onNavigate("orders");
    else if (ctx.id) onNavigate("detail", { serviceId: ctx.id });
  };

  return (
    <main className={active ? `${styles.wrap} ${styles.wrapChatOpen}` : styles.wrap}>
      <div className={styles.shell}>
        <ConversationList conversations={conversations} activeId={activeId} onSelect={setActiveId} />
        {active ? (
          <ChatWindow
            conversation={active}
            messages={thread}
            typing={typingId === active.id}
            onBack={() => setActiveId(null)}
            onSend={send}
            onOpenContext={openContext}
          />
        ) : (
          <section className={`${styles.chatPane} ${styles.chatPlaceholder}`}>
            <MessagesSquare size={44} aria-hidden="true" />
            <h2>Chọn một cuộc trò chuyện</h2>
            <p>Trao đổi yêu cầu, tiến độ và bàn giao trực tiếp với khách hàng hoặc chuyên gia của bạn.</p>
          </section>
        )}
      </div>
    </main>
  );
}
