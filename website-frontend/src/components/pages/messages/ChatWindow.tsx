"use client";

import { useTranslations } from "next-intl";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, CheckCheck, Clock, ExternalLink, Package, Paperclip, Store } from "lucide-react";
import { ME } from "../../shell/backend";
import MessageComposer from "./MessageComposer";
import { avatarColor, formatDay, formatTime, initialOf, ORDER_STATUS_LABEL, ROLE_LABEL } from "./format";
import type { ChatMessage, ConversationView } from "./types";
import styles from "./MessagesPage.module.css";
type Props = {
  conversation: ConversationView;
  messages: ChatMessage[];
  hasOlder: boolean;
  onLoadOlder: () => Promise<unknown>;
  onBack: () => void;
  onSend: (text: string) => void;
  onResend: (message: ChatMessage) => void;
  onOpenContext: () => void;
};
export default function ChatWindow({
  conversation,
  messages,
  hasOlder,
  onLoadOlder,
  onBack,
  onSend,
  onResend,
  onOpenContext
}: Props) {
  const tr = useTranslations("misc");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const ctx = conversation.context;
  const canOpenContext = ctx ? ctx.type === "order" || Boolean(ctx.id) : false;

  // New messages (last id changes) scroll to the bottom; older history
  // prepended above keeps the reader where they were.
  const firstId = messages[0]?.id;
  const lastId = messages[messages.length - 1]?.id;
  const prev = useRef({
    conversationId: "",
    firstId: undefined as string | undefined,
    lastId: undefined as string | undefined,
    height: 0
  });
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const p = prev.current;
    if (p.conversationId !== conversation.id || p.lastId !== lastId) {
      el.scrollTop = el.scrollHeight;
    } else if (p.firstId !== firstId) {
      el.scrollTop += el.scrollHeight - p.height;
    }
    prev.current = {
      conversationId: conversation.id,
      firstId,
      lastId,
      height: el.scrollHeight
    };
  }, [conversation.id, firstId, lastId]);
  const loadOlder = () => {
    setLoadingOlder(true);
    onLoadOlder().finally(() => setLoadingOlder(false));
  };
  return <section className={styles.chatPane} aria-label={tr("m1221", {
    p0: conversation.participantName
  })}>
      <header className={styles.chatHead}>
        <button type="button" className={`${styles.iconBtn} ${styles.backBtn}`} aria-label={tr("m657")} onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className={styles.avatar} style={{
        background: avatarColor(conversation.participantId)
      }} aria-hidden="true">
          {initialOf(conversation.participantName)}
        </span>
        <div className={styles.chatPeer}>
          <strong>{conversation.participantName}</strong>
          {conversation.participantRole && <span>{ROLE_LABEL[conversation.participantRole]}</span>}
        </div>
        {ctx && canOpenContext && <button type="button" className={styles.ghostBtn} onClick={onOpenContext}>
            <ExternalLink size={15} aria-hidden="true" />
            {ctx.type === "order" ? tr("m475") : tr("m1223")}
          </button>}
      </header>

      {ctx && <div className={styles.contextCard}>
          <span className={styles.contextIcon} aria-hidden="true">
            {ctx.type === "order" ? <Package size={18} /> : <Store size={18} />}
          </span>
          <div className={styles.contextBody}>
            <span className={styles.contextKind}>
              {ctx.type === "order" ? tr("m1460", {
            p0: ctx.label ? ` ${ctx.label}` : ""
          }) : tr("m1225")}
            </span>
            <strong className={styles.contextTitle}>{ctx.title}</strong>
          </div>
          {ctx.status && <span className={styles.contextStatus}>{ORDER_STATUS_LABEL[ctx.status] ?? ctx.status}</span>}
        </div>}

      <div className={styles.thread} ref={scrollRef} role="log" aria-live="polite">
        {hasOlder && <button type="button" className={`${styles.ghostBtn} ${styles.olderBtn}`} disabled={loadingOlder} onClick={loadOlder}>
            {loadingOlder ? tr("m8") : tr("m1773")}
          </button>}
        {messages.length === 0 && <p className={styles.threadEmpty}>{tr("m1560")}{conversation.participantName}{tr("m1561")}</p>}
        {messages.map((m, i) => {
        const mine = m.senderId === ME;
        const newDay = i === 0 || formatDay(messages[i - 1].createdAt) !== formatDay(m.createdAt);
        const lastOfMine = mine && messages.slice(i + 1).every(x => x.senderId !== ME);
        const bubbleClass = [styles.bubble, mine && styles.bubbleMine, m.pending && styles.bubblePending, m.failed && styles.bubbleFailed].filter(Boolean).join(" ");
        return <Fragment key={m.id}>
              {newDay && <div className={styles.daySep}>
                  <span>{formatDay(m.createdAt)}</span>
                </div>}
              <div className={mine ? `${styles.msgRow} ${styles.msgRowMine}` : styles.msgRow}>
                <div className={bubbleClass}>
                  {m.text && <p className={styles.bubbleText}>{m.text}</p>}
                  {m.attachments?.map((name, j) => <span key={`${name}-${j}`} className={styles.attachment}>
                      <Paperclip size={13} aria-hidden="true" /> {name}
                    </span>)}
                  <span className={styles.meta}>
                    <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
                    {mine && (m.failed ? <AlertCircle size={14} aria-hidden="true" /> : m.pending ? <Clock size={14} aria-label={tr("m1771")} /> : m.seen ? <CheckCheck size={14} aria-label={tr("m1226")} /> : <Check size={14} aria-label={tr("m1227")} />)}
                  </span>
                </div>
              </div>
              {m.failed && <button type="button" className={styles.failedNote} onClick={() => onResend(m)}>
                  {tr("m1772")}
                </button>}
              {lastOfMine && !m.pending && !m.failed && m.seen && <span className={styles.seenNote}>{tr("m1226")}</span>}
            </Fragment>;
      })}
      </div>

      <MessageComposer key={conversation.id} onSend={onSend} />
    </section>;
}
