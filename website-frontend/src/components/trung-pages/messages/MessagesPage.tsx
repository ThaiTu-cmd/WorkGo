"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { MessagesSquare } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { messageApi, messageErrorMessage, useMessages } from "../../webapp-bridge/backend";
import ChatWindow from "./ChatWindow";
import ConversationList from "./ConversationList";
import type { ChatMessage, ChatTarget, ConversationView, MessageState } from "./types";
import styles from "./MessagesPage.module.css";
type Props = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  conversationId?: string;
  // Thread to open (created on first contact) when arriving from a service or order.
  chatTarget?: ChatTarget | null;
};
export default function MessagesPage({
  onNavigate,
  onShowToast,
  conversationId,
  chatTarget
}: Props) {
  const tr = useTranslations("misc");
  const state = useMessages() as MessageState;
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [opening, setOpening] = useState(Boolean(chatTarget));

  // Arriving from "Contact" on a service/order: find or create the thread.
  useEffect(() => {
    if (!chatTarget) return undefined;
    let cancelled = false;
    messageApi.openConversation(chatTarget).then((id: string) => {
      if (!cancelled) setActiveId(id);
    }).catch((err: unknown) => {
      if (!cancelled) onShowToast(tr("m1769", {
        p0: messageErrorMessage(err)
      }));
    }).finally(() => {
      if (!cancelled) setOpening(false);
    });
    return () => {
      cancelled = true;
    };
    // The shell remounts this page for every new target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The open thread is polled while on screen.
  useEffect(() => activeId ? messageApi.watchConversation(activeId) : undefined, [activeId]);
  const conversations = useMemo<ConversationView[]>(() => {
    const lastById = new Map<string, ChatMessage>();
    for (const m of state.messages) {
      const prev = lastById.get(m.conversationId);
      if (!prev || prev.createdAt <= m.createdAt) lastById.set(m.conversationId, m);
    }
    return state.conversations.map(c => {
      const lastMessage = lastById.get(c.id) ?? null;
      return {
        ...c,
        participantName: c.participantName || tr("m1768", {
          p0: c.participantId.slice(0, 6)
        }),
        lastMessage,
        unread: c.unreadCount
      };
    }).sort((a, b) => (b.lastMessage?.createdAt ?? b.lastMessageAt ?? "").localeCompare(a.lastMessage?.createdAt ?? a.lastMessageAt ?? ""));
  }, [state, tr]);
  const active = conversations.find(c => c.id === activeId) ?? null;
  const thread = useMemo(() => state.messages.filter(m => m.conversationId === activeId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [state, activeId]);

  // Opening a thread (or a message landing in the open one) marks it read.
  const activeUnread = active?.unread ?? 0;
  const loadedUnread = thread.some(m => !m.read);
  useEffect(() => {
    if (activeId && (activeUnread > 0 || loadedUnread)) messageApi.markRead(activeId);
  }, [activeId, activeUnread, loadedUnread]);
  const report = (result: {
    ok: boolean;
    error?: string;
  }) => {
    if (!result.ok) onShowToast(tr("m1770", {
      p0: result.error ?? ""
    }));
  };
  const send = (text: string) => {
    if (!active) return;
    messageApi.sendMessage(active.id, text).then(report);
  };
  const resend = (message: ChatMessage) => {
    messageApi.resendMessage(message).then(report);
  };
  const openContext = () => {
    const ctx = active?.context;
    if (!ctx) return;
    if (ctx.type === "order" && ctx.id) onNavigate("orders", { orderId: ctx.id });else if (ctx.id) onNavigate("detail", {
      serviceId: ctx.id
    });
  };
  const listStatus = state.status === "error" ? <div className={styles.listEmpty} role="alert">
        <p>{tr("m1775", {
        p0: state.error ?? ""
      })}</p>
        <button type="button" className={styles.ghostBtn} onClick={() => messageApi.reload()}>{tr("m1777")}</button>
      </div> : state.status === "loading" || state.status === "idle" ? <p className={styles.listEmpty}>{tr("m1774")}</p> : null;
  return <main className={active ? `${styles.wrap} ${styles.wrapChatOpen}` : styles.wrap}>
      <div className={styles.shell}>
        <ConversationList conversations={conversations} activeId={activeId} onSelect={setActiveId} status={listStatus} />
        {active ? <ChatWindow conversation={active} messages={thread} hasOlder={Boolean(state.hasOlder[active.id])} onLoadOlder={() => messageApi.loadOlder(active.id).catch((err: unknown) => onShowToast(messageErrorMessage(err)))} onBack={() => setActiveId(null)} onSend={send} onResend={resend} onOpenContext={openContext} /> : <section className={`${styles.chatPane} ${styles.chatPlaceholder}`}>
            <MessagesSquare size={44} aria-hidden="true" />
            <h2>{opening ? tr("m1776") : tr("m1263")}</h2>
            {!opening && <p>{tr("m1264")}</p>}
          </section>}
      </div>
    </main>;
}
