"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthToken, useMessages } from "@/components/shell/backend";
import { notificationApi, isUnread, notificationTarget } from "@/marketplace/api/notificationApi";
import styles from "./NotificationBell.module.css";

type NotificationItem = { id: string; title: string; content: string; readAt: string | null; createdAt: string; referenceType: string; referenceId: string | null };

export default function NotificationBell({ className = "" }: { className?: string }) {
  const token = useAuthToken();
  return token ? <Inbox key={token} className={className} /> : null;
}

function Inbox({ className }: { className: string }) {
  const t = useTranslations("notifications");
  useMessages(); // Share the chat socket, including notification subscription.
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const version = useRef(0);
  const reading = useRef(false);
  const load = useCallback(async () => {
    if (reading.current) return;
    const request = ++version.current;
    try {
      const inbox = await notificationApi.getInbox();
      if (!alive.current || request !== version.current) return;
      setItems(inbox.items); setUnreadCount(inbox.unreadCount); setError(false);
    } catch { if (alive.current && request === version.current) setError(true); }
    finally { if (alive.current && request === version.current) setLoading(false); }
  }, []);
  useEffect(() => {
    alive.current = true;
    const refresh = () => { void load(); };
    queueMicrotask(refresh);
    const timer = setInterval(refresh, 30000);
    window.addEventListener("workgo-notification", refresh);
    return () => { alive.current = false; clearInterval(timer); window.removeEventListener("workgo-notification", refresh); };
  }, [load]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", outside); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("mousedown", outside); window.removeEventListener("keydown", escape); };
  }, [open]);
  const read = async (item?: NotificationItem) => {
    if (reading.current) return;
    reading.current = true; setBusy(true); version.current++;
    try {
      if (item) { if (isUnread(item)) await notificationApi.markRead(item.id); }
      else await notificationApi.readAll();
      if (!alive.current) return;
      reading.current = false;
      await load();
      if (!alive.current) return;
      if (item) {
        const target = notificationTarget(item);
        if (target) { window.dispatchEvent(new CustomEvent("workgo-navigate", { detail: target })); setOpen(false); }
      }
    } catch { if (alive.current) setError(true); }
    finally { reading.current = false; if (alive.current) setBusy(false); }
  };
  return (
    <div className={`${styles.root} ${className}`} ref={root}>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label={t("title")}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          void load();
        }}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>
      {open && (
        <section className={styles.popover} aria-label={t("title")}>
          <div className={styles.header}>
            <h2 className={styles.title}>{t("title")}</h2>
            <button
              type="button"
              className={styles.readAllBtn}
              disabled={busy || !unreadCount}
              onClick={() => void read()}
            >
              <CheckCheck size={14} aria-hidden="true" />
              <span>{t("readAll")}</span>
            </button>
          </div>
          {error && (
            <div className={styles.errorBox} role="alert">
              <span>{t("error")}</span>
              <button type="button" className={styles.retryBtn} onClick={() => void load()}>
                {t("retry")}
              </button>
            </div>
          )}
          <div className={styles.list}>
            {loading ? (
              <div className={styles.stateBox}>
                <Loader2 size={20} className={styles.spin} aria-label={t("loading")} />
              </div>
            ) : !error && !items.length ? (
              <p className={styles.stateBox}>{t("empty")}</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void read(item)}
                  className={`${styles.itemBtn} ${isUnread(item) ? styles.itemUnread : ""}`}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  <p className={styles.itemContent}>{item.content}</p>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
