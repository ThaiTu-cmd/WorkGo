"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthToken, useMessages } from "@/components/webapp-bridge/backend";
import { notificationApi, isUnread, notificationTarget } from "@/_webapp-mirror/api/notificationApi";

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
  return <div className={className} ref={root} style={{ position: "relative" }}>
    <button type="button" aria-label={t("title")} aria-expanded={open} onClick={() => { setOpen(!open); void load(); }} style={{ minWidth: 44, minHeight: 44, background: "transparent", border: 0, color: "inherit" }}>
      <Bell size={20} />{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && <section aria-label={t("title")} style={{ position: "absolute", top: "100%", right: 0, width: "min(320px, 85vw)", maxHeight: 420, overflowY: "auto", zIndex: 100, padding: 12, background: "var(--wg-surface, var(--bg-surface, #fff))", color: "var(--wg-text, var(--text-primary, #222))", boxShadow: "0 8px 24px #0003", borderRadius: 12 }}>
      <h2>{t("title")}</h2>
      <button type="button" disabled={busy || !unreadCount} onClick={() => void read()}><CheckCheck size={16} />{t("readAll")}</button>
      {error && <div role="alert">{t("error")} <button type="button" onClick={() => void load()}>{t("retry")}</button></div>}
      {loading ? <Loader2 aria-label={t("loading")} /> : !error && !items.length ? <p>{t("empty")}</p> : null}
      {items.map(item => <button key={item.id} type="button" disabled={busy} onClick={() => void read(item)} style={{ display: "block", textAlign: "left", width: "100%", padding: 12, border: 0, color: "inherit", background: "transparent", fontWeight: isUnread(item) ? 700 : 400 }}>
        <span>{item.title}</span><p>{item.content}</p>
      </button>)}
    </section>}
  </div>;
}
