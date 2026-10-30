"use client";

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

export default function ConversationList({ conversations, activeId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = conversations.filter(
    (c) =>
      (!unreadOnly || c.unread > 0) &&
      (q === "" ||
        c.participantName.toLowerCase().includes(q) ||
        c.context?.title.toLowerCase().includes(q) ||
        c.lastMessage?.text.toLowerCase().includes(q)),
  );

  return (
    <aside className={styles.listPane} aria-label="Danh sách hội thoại">
      <div className={styles.listHead}>
        <h1 className={styles.listTitle}>Tin nhắn</h1>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, dịch vụ..."
            aria-label="Tìm hội thoại"
          />
        </label>
        <div className={styles.tabs} role="group" aria-label="Lọc hội thoại">
          {[false, true].map((u) => (
            <button
              key={String(u)}
              type="button"
              className={u === unreadOnly ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              aria-pressed={u === unreadOnly}
              onClick={() => setUnreadOnly(u)}
            >
              {u ? "Chưa đọc" : "Tất cả"}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.listEmpty}>
          {conversations.length === 0
            ? "Chưa có cuộc trò chuyện nào. Nhắn tin cho chuyên gia từ trang dịch vụ hoặc đơn hàng."
            : "Không có hội thoại phù hợp."}
        </p>
      ) : (
        <ul className={styles.convList}>
          {visible.map((c) => {
            const last = c.lastMessage;
            const preview = last
              ? `${last.senderId === ME ? "Bạn: " : ""}${last.text || (last.attachments?.length ? "📎 Tệp đính kèm" : "")}`
              : "Bắt đầu cuộc trò chuyện";
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={c.id === activeId ? `${styles.convItem} ${styles.convItemActive}` : styles.convItem}
                  aria-current={c.id === activeId ? "true" : undefined}
                  onClick={() => onSelect(c.id)}
                >
                  <span className={styles.avatar} style={{ background: avatarColor(c.participantId) }} aria-hidden="true">
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
                      {c.unread > 0 && (
                        <span className={styles.badge} aria-label={`${c.unread} tin chưa đọc`}>
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
