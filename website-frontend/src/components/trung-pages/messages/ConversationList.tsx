"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Search } from "lucide-react";
import { ME } from "../../webapp-bridge/backend";
import { avatarColor, formatListTime, initialOf, ROLE_LABEL } from "./format";
import type { ConversationView } from "./types";
import styles from "./MessagesPage.module.css";
type Props = {
  conversations: ConversationView[];
  activeId: string | null;
  onSelect: (id: string) => void;
};
export default function ConversationList({
  conversations,
  activeId,
  onSelect
}: Props) {
  const tr = useTranslations("misc");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const q = query.trim().toLowerCase();
  const visible = conversations.filter(c => (!unreadOnly || c.unread > 0) && (q === "" || c.participantName.toLowerCase().includes(q) || c.context?.title.toLowerCase().includes(q) || c.lastMessage?.text.toLowerCase().includes(q)));
  return <aside className={styles.listPane} aria-label={tr("m1233")}>
      <div className={styles.listHead}>
        <h1 className={styles.listTitle}>{tr("m50")}</h1>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={tr("m1234")} aria-label={tr("m1235")} />
        </label>
        <div className={styles.tabs} role="group" aria-label={tr("m1236")}>
          {[false, true].map(u => <button key={String(u)} type="button" className={u === unreadOnly ? `${styles.tab} ${styles.tabActive}` : styles.tab} aria-pressed={u === unreadOnly} onClick={() => setUnreadOnly(u)}>
              {u ? tr("m1237") : tr("m142")}
            </button>)}
        </div>
      </div>

      {visible.length === 0 ? <p className={styles.listEmpty}>
          {conversations.length === 0 ? tr("m1238") : tr("m1239")}
        </p> : <ul className={styles.convList}>
          {visible.map(c => {
        const last = c.lastMessage;
        const preview = last ? `${last.senderId === ME ? tr("m1562") : ""}${last.text || (last.attachments?.length ? tr("m1563") : "")}` : tr("m1241");
        return <li key={c.id}>
                <button type="button" className={c.id === activeId ? `${styles.convItem} ${styles.convItemActive}` : styles.convItem} aria-current={c.id === activeId ? "true" : undefined} onClick={() => onSelect(c.id)}>
                  <span className={styles.avatar} style={{
              background: avatarColor(c.participantId)
            }} aria-hidden="true">
                    {initialOf(c.participantName)}
                  </span>
                  <span className={styles.convBody}>
                    <span className={styles.convTop}>
                      <strong className={styles.convName}>{c.participantName}</strong>
                      <time className={styles.convTime} dateTime={last?.createdAt ?? c.lastMessageAt}>
                        {formatListTime(last?.createdAt ?? c.lastMessageAt)}
                      </time>
                    </span>
                    <span className={styles.convRole}>
                      {ROLE_LABEL[c.participantRole]}
                      {c.context ? ` · ${c.context.title}` : ""}
                    </span>
                    <span className={styles.convBottom}>
                      <span className={c.unread > 0 ? `${styles.convPreview} ${styles.convPreviewUnread}` : styles.convPreview}>
                        {preview}
                      </span>
                      {c.unread > 0 && <span className={styles.badge} aria-label={tr("m1242", {
                  p0: c.unread
                })}>
                          {c.unread}
                        </span>}
                    </span>
                  </span>
                </button>
              </li>;
      })}
        </ul>}
    </aside>;
}