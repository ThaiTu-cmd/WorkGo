"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { notificationApi, useAuthToken } from "@/components/webapp-bridge/backend";

type NotificationItem = {
  notificationId?: string;
  id?: string;
  title?: string;
  content?: string;
  message?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
};

export default function NotificationBell({ className = "" }: { className?: string }) {
  const token = useAuthToken();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationApi.listNotifications({ size: 15 });
      const list = res?.result?.data || res?.result || [];
      if (Array.isArray(list)) {
        setItems(list);
        const unread = list.filter((n: NotificationItem) => !(n.read ?? n.isRead)).length;
        setUnreadCount(unread);
      }
    } catch {
      // In dev or when offline, fallback quietly
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await notificationApi.listNotifications({ size: 15 });
        if (cancelled) return;
        const list = res?.result?.data || res?.result || [];
        if (Array.isArray(list)) {
          setItems(list);
          const unread = list.filter((n: NotificationItem) => !(n.read ?? n.isRead)).length;
          setUnreadCount(unread);
        }
      } catch {
        // fallback
      }
    };
    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      setLoading(true);
      void fetchNotifications().finally(() => setLoading(false));
    }
    setOpen(!open);
  };

  const handleMarkRead = async (id?: string) => {
    if (!id) return;
    try {
      await notificationApi.markRead(id);
      setItems((prev) =>
        prev.map((it) => (it.notificationId === id || it.id === id ? { ...it, read: true, isRead: true } : it))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleReadAll = async () => {
    try {
      await notificationApi.readAll();
      setItems((prev) => prev.map((it) => ({ ...it, read: true, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  if (!token) return null;

  return (
    <div className={`notification-bell-container ${className}`} ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Thông báo"
        aria-expanded={open}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 44,
          minHeight: 44,
          borderRadius: "50%",
          color: "var(--wg-text, var(--text-primary, #333))",
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              borderRadius: "8px",
              background: "#ef4444",
              color: "#fff",
              fontSize: "0.68rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--wg-surface, var(--bg-surface, #ffffff))",
            border: "1px solid var(--border-default, rgba(0,0,0,0.1))",
            borderRadius: 12,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            zIndex: 100,
            color: "var(--wg-text, var(--text-primary, #222))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary, #1677FF)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCheck size={14} /> Đã đọc hết
              </button>
            )}
          </div>

          <div style={{ padding: "8px 0" }}>
            {loading && items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted, #888)" }}>
                <Loader2 size={20} className="spin" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : items.length === 0 ? (
              <p style={{ textAlign: "center", padding: "24px 16px", margin: 0, color: "var(--text-muted, #888)", fontSize: "0.85rem" }}>
                Không có thông báo mới
              </p>
            ) : (
              items.map((it, idx) => {
                const id = it.notificationId || it.id;
                const isUnread = !(it.read ?? it.isRead);
                return (
                  <div
                    key={id || `notif-${idx}`}
                    onClick={() => handleMarkRead(id)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      background: isUnread ? "var(--wg-primary-light, rgba(22, 119, 255, 0.08))" : "transparent",
                      borderBottom: "1px solid var(--border-subtle, rgba(0,0,0,0.04))",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "0.86rem", fontWeight: isUnread ? 600 : 400, marginBottom: 2 }}>
                      {it.title || "Thông báo từ hệ thống"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary, #666)", lineHeight: 1.4 }}>
                      {it.content || it.message || ""}
                    </div>
                    {it.createdAt && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #999)", marginTop: 4 }}>
                        {new Date(it.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
