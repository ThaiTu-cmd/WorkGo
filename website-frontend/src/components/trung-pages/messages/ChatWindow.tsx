"use client";

import { Fragment, useEffect, useRef } from "react";
import { ArrowLeft, Check, CheckCheck, ExternalLink, Package, Paperclip, Store } from "lucide-react";
import { ME } from "../../webapp-bridge/backend";
import MessageComposer from "./MessageComposer";
import { avatarColor, formatDay, formatTime, initialOf, ORDER_STATUS_LABEL, ROLE_LABEL } from "./format";
import type { ChatMessage, Conversation } from "./types";
import styles from "./MessagesPage.module.css";

type Props = {
  conversation: Conversation;
  messages: ChatMessage[];
  typing: boolean;
  onBack: () => void;
  onSend: (text: string, attachments: string[]) => void;
  onOpenContext: () => void;
};

export default function ChatWindow({ conversation, messages, typing, onBack, onSend, onOpenContext }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ctx = conversation.context;
  // Seeded demo threads have no real service/order to open.
  const canOpenContext = ctx ? ctx.type === "order" || Boolean(ctx.id) : false;

  // Keep the newest message in view (scroll the thread, not the page).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, messages.length, typing]);

  return (
    <section className={styles.chatPane} aria-label={`Trò chuyện với ${conversation.participantName}`}>
      <header className={styles.chatHead}>
        <button type="button" className={`${styles.iconBtn} ${styles.backBtn}`} aria-label="Quay lại danh sách" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className={styles.avatar} style={{ background: avatarColor(conversation.participantId) }} aria-hidden="true">
          {initialOf(conversation.participantName)}
        </span>
        <div className={styles.chatPeer}>
          <strong>{conversation.participantName}</strong>
          <span>{typing ? "Đang nhập..." : ROLE_LABEL[conversation.participantRole]}</span>
        </div>
        {ctx && canOpenContext && (
          <button type="button" className={styles.ghostBtn} onClick={onOpenContext}>
            <ExternalLink size={15} aria-hidden="true" />
            {ctx.type === "order" ? "Xem đơn hàng" : "Xem dịch vụ"}
          </button>
        )}
      </header>

      {ctx && (
        <div className={styles.contextCard}>
          <span className={styles.contextIcon} aria-hidden="true">
            {ctx.type === "order" ? <Package size={18} /> : <Store size={18} />}
          </span>
          <div className={styles.contextBody}>
            <span className={styles.contextKind}>
              {ctx.type === "order" ? `Đơn hàng${ctx.label ? ` ${ctx.label}` : ""}` : "Dịch vụ đang trao đổi"}
            </span>
            <strong className={styles.contextTitle}>{ctx.title}</strong>
          </div>
          {ctx.status && <span className={styles.contextStatus}>{ORDER_STATUS_LABEL[ctx.status] ?? ctx.status}</span>}
        </div>
      )}

      <div className={styles.thread} ref={scrollRef} role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className={styles.threadEmpty}>
            Hãy gửi lời chào tới {conversation.participantName}. Trao đổi rõ yêu cầu trước khi đặt đơn giúp công việc suôn sẻ hơn.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === ME;
          const newDay = i === 0 || formatDay(messages[i - 1].createdAt) !== formatDay(m.createdAt);
          const lastOfMine = mine && messages.slice(i + 1).every((x) => x.senderId !== ME);
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className={styles.daySep}>
                  <span>{formatDay(m.createdAt)}</span>
                </div>
              )}
              <div className={mine ? `${styles.msgRow} ${styles.msgRowMine}` : styles.msgRow}>
                <div className={mine ? `${styles.bubble} ${styles.bubbleMine}` : styles.bubble}>
                  {m.text && <p className={styles.bubbleText}>{m.text}</p>}
                  {m.attachments?.map((name, j) => (
                    <span key={`${name}-${j}`} className={styles.attachment}>
                      <Paperclip size={13} aria-hidden="true" /> {name}
                    </span>
                  ))}
                  <span className={styles.meta}>
                    <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
                    {mine &&
                      (m.seen ? (
                        <CheckCheck size={14} aria-label="Đã xem" />
                      ) : (
                        <Check size={14} aria-label="Đã gửi" />
                      ))}
                  </span>
                </div>
              </div>
              {lastOfMine && m.seen && <span className={styles.seenNote}>Đã xem</span>}
            </Fragment>
          );
        })}
        {typing && (
          <div className={styles.msgRow}>
            <div className={`${styles.bubble} ${styles.typing}`} aria-label="Đang nhập">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <MessageComposer key={conversation.id} onSend={onSend} />
    </section>
  );
}
