"use client";
// Hệ Thống Trò Chuyện Giả Lập

import { useTranslations } from "next-intl";
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
const QUOTA_MESSAGE = "Browser memory is full or blocked \u2014 messages are held for this session only.";

// Mock counterpart replies until a real messaging service exists.
const REPLIES: Record<Conversation["participantRole"], string[]> = {
  PROVIDER: ["Thank you for your message! I have received the information and will respond in detail immediately.", "Okay, okay? Can you send more examples or specific requirements so I can quote more accurately?", "I can start today. You choose the appropriate package and then place an order through WorkGo so your money is kept safe in Escrow."],
  CLIENT: ["Ok, I've seen it.", "Thank you, then I'll wait for the update.", "Can you tell me when the expected completion time is?"]
};
export default function MessagesPage({
  onNavigate,
  onShowToast,
  conversationId
}: Props) {
  const tr = useTranslations("misc");
  const state = useMessages() as MessageState;
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(t => clearTimeout(t));
  }, []);
  const conversations = useMemo<ConversationView[]>(() => {
    const lastById = new Map<string, MessageState["messages"][number]>();
    for (const m of state.messages) {
      const prev = lastById.get(m.conversationId);
      if (!prev || prev.createdAt <= m.createdAt) lastById.set(m.conversationId, m);
    }
    return state.conversations.map(c => ({
      ...c,
      lastMessage: lastById.get(c.id) ?? null,
      unread: unreadOf(state, c.id)
    })).sort((a, b) => (b.lastMessage?.createdAt ?? b.lastMessageAt).localeCompare(a.lastMessage?.createdAt ?? a.lastMessageAt));
  }, [state]);
  const active = conversations.find(c => c.id === activeId) ?? null;
  const thread = useMemo(() => state.messages.filter(m => m.conversationId === activeId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [state, activeId]);

  // Opening a thread (or a reply landing in the open one) marks it read.
  const activeUnread = active?.unread ?? 0;
  useEffect(() => {
    if (activeId && activeUnread > 0) messageApi.markRead(activeId);
  }, [activeId, activeUnread]);
  const send = (text: string, attachments: string[]) => {
    if (!active) return;
    const {
      ok
    } = messageApi.sendMessage(active.id, text, attachments);
    if (!ok) onShowToast(QUOTA_MESSAGE);
    const {
      id,
      participantId,
      participantRole
    } = active;
    const replies = REPLIES[participantRole];
    timers.current.push(setTimeout(() => setTypingId(id), 600), setTimeout(() => {
      setTypingId(cur => cur === id ? null : cur);
      messageApi.receiveMessage(id, participantId, replies[Math.floor(Math.random() * replies.length)]);
    }, 2200));
  };
  const openContext = () => {
    const ctx = active?.context;
    if (!ctx) return;
    if (ctx.type === "order") onNavigate("orders");else if (ctx.id) onNavigate("detail", {
      serviceId: ctx.id
    });
  };
  return <main className={active ? `${styles.wrap} ${styles.wrapChatOpen}` : styles.wrap}>
      <div style={{
      padding: "8px 14px",
      backgroundColor: "#fef3c7",
      border: "1px solid #fde68a",
      borderRadius: "8px",
      color: "#92400e",
      fontSize: "0.82rem",
      marginBottom: "12px",
      fontWeight: 500
    }}>{tr("m1262")}</div>
      <div className={styles.shell}>
        <ConversationList conversations={conversations} activeId={activeId} onSelect={setActiveId} />
        {active ? <ChatWindow conversation={active} messages={thread} typing={typingId === active.id} onBack={() => setActiveId(null)} onSend={send} onOpenContext={openContext} /> : <section className={`${styles.chatPane} ${styles.chatPlaceholder}`}>
            <MessagesSquare size={44} aria-hidden="true" />
            <h2>{tr("m1263")}</h2>
            <p>{tr("m1264")}</p>
          </section>}
      </div>
    </main>;
}