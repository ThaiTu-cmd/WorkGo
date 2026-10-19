"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { addressApi, fromAddressForm, pageItems, toAddress, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./AddressBookPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

// AddressResponse mapped by `toAddress` (identity-service /addresses).
export type Address = {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
  note: string;
  detail: string;
};

type LoadState = "loading" | "ready" | "needs-login" | "error";

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

const EMPTY: Address = {
  id: "",
  label: "",
  receiver: "",
  phone: "",
  line1: "",
  ward: "",
  district: "",
  city: "",
  note: "",
  detail: "",
};

const apiMessage = (err: unknown) => (err as Error)?.message || "lỗi kết nối máy chủ";

export default function AddressBookPage({ onNavigate, onShowToast }: TrungPageProps) {
  const token = useAuthToken();
  const [result, setResult] = useState<{ token: string; state: LoadState; items: Address[] } | null>(null);
  const current = token && result?.token === token ? result : null;
  const state: LoadState = !token ? "needs-login" : current ? current.state : "loading";
  const items = current?.items ?? [];
  const setItems = (update: (prev: Address[]) => Address[]) =>
    setResult((r) => (r ? { ...r, items: update(r.items) } : r));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Address>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const fetchAddresses = useCallback(
    (forToken: string) =>
      addressApi.getMy(0, 50).then(
        (res: unknown) => ({ token: forToken, state: "ready" as LoadState, items: pageItems(res).map(toAddress) }),
        (err: { status?: number }) => ({
          token: forToken,
          state: (err?.status === 401 ? "needs-login" : "error") as LoadState,
          items: [] as Address[],
        }),
      ),
    [],
  );

  const load = useCallback(async () => {
    if (token) setResult(await fetchAddresses(token));
  }, [token, fetchAddresses]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    fetchAddresses(token).then((next) => {
      if (!cancelled) setResult(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token, fetchAddresses]);

  const retry = () => {
    setResult(null);
    void load();
  };

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
    setDraft({ ...EMPTY });
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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = {
      label: sanitizeText(draft.label),
      receiver: sanitizeText(draft.receiver),
      phone: sanitizeText(draft.phone),
      line1: sanitizeText(draft.line1),
      ward: sanitizeText(draft.ward),
      district: sanitizeText(draft.district),
      city: sanitizeText(draft.city),
      note: sanitizeText(draft.note),
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
    if (clean.line1.length < 5) {
      setError("Vui lòng nhập địa chỉ chi tiết từ 5 ký tự!");
      return;
    }
    if (clean.city.length < 2) {
      setError("Vui lòng nhập tỉnh / thành phố!");
      return;
    }
    setSaving(true);
    try {
      const body = fromAddressForm(clean);
      if (editingId) await addressApi.update(editingId, body);
      else await addressApi.create(body);
    } catch (err) {
      setError(`Không lưu được địa chỉ: ${apiMessage(err)}`);
      return;
    } finally {
      setSaving(false);
    }
    setOpen(false);
    onShowToast(editingId ? "Đã cập nhật địa chỉ!" : "Đã thêm địa chỉ mới!");
    load();
  };

  const removeAddress = async (id: string) => {
    try {
      await addressApi.remove(id);
    } catch (err) {
      onShowToast(`Không xóa được địa chỉ: ${apiMessage(err)}`);
      return;
    }
    setItems((prev) => prev.filter((a) => a.id !== id));
    onShowToast("Đã xóa địa chỉ!");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            <MapPin size={24} className={styles.titleIcon} aria-hidden="true" /> Sổ địa chỉ
          </h1>
          <p className={styles.sub}>Quản lý địa chỉ giao nhận cho các đơn hàng của bạn.</p>
        </div>
        {state === "ready" ? (
          <button type="button" className={styles.primary} onClick={openAdd}>
            Thêm địa chỉ
          </button>
        ) : null}
      </div>

      {state === "loading" ? <p className={styles.empty}>Đang tải sổ địa chỉ...</p> : null}
      {state === "needs-login" ? (
        <div className={styles.empty}>
          <p>Đăng nhập để quản lý sổ địa chỉ của bạn.</p>
          <button type="button" className={styles.primary} onClick={() => onNavigate("login")}>
            Đăng nhập
          </button>
        </div>
      ) : null}
      {state === "error" ? (
        <div className={styles.empty} role="alert">
          <p>Không tải được sổ địa chỉ từ máy chủ.</p>
          <button type="button" className={styles.ghost} onClick={retry}>
            Thử lại
          </button>
        </div>
      ) : null}

      {state !== "ready" ? null : items.length === 0 ? (
        <p className={styles.empty}>Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên của bạn.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((a) => (
            <li key={a.id} className={styles.item}>
              <p className={styles.label}>
                {a.label}
              </p>
              <p className={styles.detail}>
                {a.receiver} • {a.phone}
              </p>
              <p className={styles.detail}>{a.detail}</p>
              {a.note ? <p className={styles.detail}>{a.note}</p> : null}
              <div className={styles.actions}>
                <button type="button" className={styles.ghost} onClick={() => openEdit(a)}>
                  Sửa
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => removeAddress(a.id)}
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
                <span>Số nhà, đường</span>
                <input value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Phường / Xã</span>
                <input value={draft.ward} onChange={(e) => setDraft({ ...draft, ward: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Quận / Huyện</span>
                <input value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Tỉnh / Thành phố</span>
                <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Ghi chú</span>
                <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              </label>
              {error ? <em className={styles.error}>{error}</em> : null}
              <div className={styles.dialogActions}>
                <button type="button" className={styles.ghost} onClick={() => setOpen(false)}>
                  Hủy (Esc)
                </button>
                <button type="submit" className={styles.primary} disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
