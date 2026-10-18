"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { useLocalList } from "../_stores/useLocalList";
import { mockAddresses } from "../_mocks/mockAddresses";
import styles from "./AddressBookPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export type Address = {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  detail: string;
  isDefault: boolean;
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

const EMPTY: Address = { id: "", label: "", receiver: "", phone: "", detail: "", isDefault: false };

export default function AddressBookPage({ onShowToast }: TrungPageProps) {
  const quotaToast = useCallback(
    () => onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này."),
    [onShowToast],
  );
  const { items, add, update, remove } = useLocalList<Address>(KEYS.addresses, mockAddresses, quotaToast);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Address>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      firstInputRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "Tab" && dialogRef.current) {
          const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, input, [tabindex]:not([tabindex="-1"])',
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    return undefined;
  }, [open ]);

  const openAdd = () => {
    setDraft({ ...EMPTY, id: `addr-${Date.now()}` });
    setEditingId(null);
    setError("");
    setOpen(true);
  };

  const openEdit = (a: Address) => {
    setDraft({ ...a });
    setEditingId(a.id);
    setError("");
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const clean: Address = {
      id: draft.id,
      label: sanitizeText(draft.label),
      receiver: sanitizeText(draft.receiver),
      phone: sanitizeText(draft.phone),
      detail: sanitizeText(draft.detail),
      isDefault: draft.isDefault,
    };
    if (clean.label.length < 2) {
      setError("Vui lòng nhập nhãn địa chỉ từ 2 ký tự!");
      return;
    }
    if (clean.receiver.length < 2) {
      setError("Vui lòng nhập tên người nhận từ 2 ký tự!");
      return;
    }
    if (!/^0\d{9}$/.test(clean.phone)) {
      setError("Số điện thoại phải 10 số, bắt đầu bằng 0!");
      return;
    }
    if (clean.detail.length < 5) {
      setError("Vui lòng nhập địa chỉ chi tiết từ 5 ký tự!");
      return;
    }
    if (editingId) update(editingId, clean);
    else add(clean);
    setOpen(false);
    onShowToast(editingId ? "Đã cập nhật địa chỉ!" : "Đã thêm địa chỉ mới!");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Sổ địa chỉ</h1>
          <p className={styles.sub}>Quản lý địa chỉ giao nhận cho các đơn hàng của bạn.</p>
        </div>
        <button type="button" className={styles.primary} onClick={openAdd}>
          Thêm địa chỉ
        </button>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên của bạn.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((a) => (
            <li key={a.id} className={styles.item}>
              <p className={styles.label}>
                {a.label} {a.isDefault ? <span className={styles.badge}>Mặc định</span> : null}
              </p>
              <p className={styles.detail}>
                {a.receiver} • {a.phone}
              </p>
              <p className={styles.detail}>{a.detail}</p>
              <div className={styles.actions}>
                <button type="button" className={styles.ghost} onClick={() => openEdit(a)}>
                  Sửa
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => {
                    remove(a.id);
                    onShowToast("Đã xóa địa chỉ!");
                  }}
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className={styles.overlay} role="presentation" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.dialogTitle}>{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h2>
            <form onSubmit={save} noValidate className={styles.form}>
              <label className={styles.field}>
                <span>Nhãn (Nhà riêng, Công ty...)</span>
                <input ref={firstInputRef} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Người nhận</span>
                <input value={draft.receiver} onChange={(e) => setDraft({ ...draft, receiver: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Số điện thoại</span>
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} inputMode="tel" />
              </label>
              <label className={styles.field}>
                <span>Địa chỉ chi tiết</span>
                <input value={draft.detail} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} />
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
                />
                Đặt làm địa chỉ mặc định
              </label>
              {error ? <em className={styles.error}>{error}</em> : null}
              <div className={styles.dialogActions}>
                <button type="button" className={styles.ghost} onClick={() => setOpen(false)}>
                  Hủy (Esc)
                </button>
                <button type="submit" className={styles.primary}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
