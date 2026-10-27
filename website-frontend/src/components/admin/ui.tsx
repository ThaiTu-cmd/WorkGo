"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { ApiError } from "@/components/webapp-bridge/backend";
import styles from "./admin.module.css";

export const cx = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(" ");

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 403) {
    return "Tài khoản không có quyền thực hiện thao tác này.";
  }
  return err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export function shortId(id?: string | null): string {
  return id ? `${id.slice(0, 8)}…` : "—";
}

// ---------- Status ----------

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã duyệt",
  REJECTED: "Từ chối",
  SUSPENDED: "Tạm khoá",
  ACTIVE: "Hoạt động",
  DISABLE: "Vô hiệu",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: styles.badgeWarning,
  VERIFIED: styles.badgeSuccess,
  ACTIVE: styles.badgeSuccess,
  REJECTED: styles.badgeDanger,
  DISABLE: styles.badgeDanger,
  SUSPENDED: styles.badgeInfo,
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className={styles.badge}>—</span>;
  return <span className={cx(styles.badge, STATUS_TONE[status])}>{STATUS_LABEL[status] ?? status}</span>;
}

// Mirrors identity-service VerificationStatus.canTransitionTo.
export const VERIFICATION_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["VERIFIED", "REJECTED"],
  VERIFIED: ["SUSPENDED"],
  REJECTED: ["SUSPENDED"],
  SUSPENDED: ["VERIFIED", "REJECTED"],
};

export const VERIFICATION_STATUSES = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];

export function StatusTabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {options.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={s === value}
          className={cx(styles.tab, s === value && styles.tabActive)}
          onClick={() => onChange(s)}
        >
          {STATUS_LABEL[s] ?? s}
        </button>
      ))}
    </div>
  );
}

// ---------- Layout bits ----------

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {sub && <p className={styles.pageSub}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Notice({ tone, children }: { tone?: "success" | "error"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(styles.notice, tone === "success" && styles.noticeSuccess, tone === "error" && styles.noticeError)}
    >
      {children}
    </div>
  );
}

export function ListState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <div className={styles.state}>
        <Loader2 className={styles.spin} size={22} /> Đang tải…
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx(styles.state, styles.stateError)}>
        <AlertCircle size={22} />
        {error}
        {onRetry && (
          <button type="button" className={styles.btn} onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className={styles.state}>
        <Inbox size={22} /> Không có dữ liệu.
      </div>
    );
  }
  return null;
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className={styles.pagination}>
      <span>
        Tổng {totalElements} · Trang {totalPages ? page + 1 : 0}/{totalPages}
      </span>
      <div className={styles.paginationButtons}>
        <button
          type="button"
          className={styles.btn}
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={page + 1 >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className={styles.dialogBackdrop} onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
        <h2 id="admin-dialog-title" className={styles.dialogTitle}>
          {title}
        </h2>
        <div className={styles.dialogBody}>{body}</div>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>
            Huỷ
          </button>
          <button
            type="button"
            className={cx(styles.btn, danger ? styles.btnDangerSolid : styles.btnPrimary)}
            onClick={onConfirm}
            disabled={busy}
            autoFocus
          >
            {busy && <Loader2 size={14} className={styles.spin} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Data ----------

type PageResult<T> = { data?: T[]; totalElements?: number; totalPages?: number };

/**
 * Loads one page of an admin list endpoint. `load` receives the page index and
 * must resolve to the ApiResponse<PageResponse<T>> body. Changing `key`
 * (e.g. the status filter) resets to page 0.
 */
export function useAdminList<T>(load: (page: number) => Promise<{ result?: PageResult<T> }>, key: string) {
  const [state, setState] = useState({ key, page: 0 });
  const page = state.key === key ? state.page : 0;
  const [nonce, setNonce] = useState(0);
  const request = `${key}|${page}|${nonce}`;
  const [loaded, setLoaded] = useState<{
    request: string;
    items: T[];
    totalElements: number;
    totalPages: number;
    error: string | null;
  }>({ request: "", items: [], totalElements: 0, totalPages: 0, error: null });

  useEffect(() => {
    let alive = true;
    load(page)
      .then((res) => {
        const r = res?.result ?? {};
        if (alive) {
          setLoaded({
            request,
            items: r.data ?? [],
            totalElements: r.totalElements ?? 0,
            totalPages: r.totalPages ?? 0,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (alive) setLoaded({ request, items: [], totalElements: 0, totalPages: 0, error: errorMessage(err) });
      });
    return () => {
      alive = false;
    };
    // `load` is recreated each render; `request` captures its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const setPage = useCallback((p: number) => setState({ key, page: p }), [key]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const loading = loaded.request !== request;

  return {
    items: loaded.items,
    page,
    setPage,
    totalElements: loaded.totalElements,
    totalPages: loaded.totalPages,
    loading,
    error: loading ? null : loaded.error,
    reload,
  };
}
