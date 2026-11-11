"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { mockDisputes, type Dispute, type DisputeKind, type DisputeStatus } from "../_mocks/mockDisputes";
import { KEYS } from "../_stores/keys";
import { useLocalList } from "../_stores/useLocalList";
import styles from "./DisputeCenterPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

export default function DisputeCenterPage({ onShowToast }: TrungPageProps) {
  const quotaToast = useCallback(
    () => onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này."),
    [onShowToast],
  );
  const seed = mockDisputes.map((d) => ({ ...d, id: d.ticketId }));
  const { items, add, update } = useLocalList<Dispute & { id: string }>(KEYS.disputes, seed, quotaToast);
  const [filter, setFilter] = useState<"ALL" | DisputeStatus>("ALL");
  const [kind, setKind] = useState<DisputeKind>("REPORT");
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEYS.disputes) == null) {
        window.localStorage.setItem(KEYS.disputes, JSON.stringify(mockDisputes));
      }
    } catch {
      /* bỏ qua */
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrder = sanitizeText(orderId);
    const cleanReason = sanitizeText(reason);
    const cleanEvidence = sanitizeText(evidenceUrl);
    if (cleanOrder.length < 2) {
      setError("Vui lòng nhập mã đơn hàng!");
      return;
    }
    if (cleanReason.length < 20) {
      setError("Vui lòng nhập lý do chi tiết từ 20 ký tự trở lên!");
      return;
    }
    if (cleanEvidence !== "") {
      try {
        const u = new URL(cleanEvidence);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad");
      } catch {
        setError("Link minh chứng chưa đúng định dạng URL!");
        return;
      }
    }
    setError("");
    const ticketId = `TCK-${Date.now().toString().slice(-6)}`;
    add({
      id: ticketId,
      ticketId,
      kind,
      orderId: cleanOrder,
      reason: cleanReason,
      evidenceUrl: cleanEvidence || undefined,
      status: "OPEN",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setOrderId("");
    setReason("");
    setEvidenceUrl("");
    onShowToast("Đã gửi phiếu hỗ trợ, WorkGo sẽ phản hồi sớm!");
  };

  const visible = items.filter((t) => (filter === "ALL" ? true : t.status === filter));

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>
        <ShieldAlert size={24} className={styles.titleIcon} aria-hidden="true" /> Trung tâm tranh chấp & báo cáo
      </h1>
      <p className={styles.sub}>Gửi báo cáo vi phạm hoặc yêu cầu hòa giải tranh chấp đơn hàng.</p>

      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>Loại phiếu</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as DisputeKind)}>
              <option value="REPORT">Báo cáo vi phạm</option>
              <option value="DISPUTE">Tranh chấp đơn hàng</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>Mã đơn hàng</span>
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-1042" />
          </label>
        </div>
        <label className={styles.field}>
          <span>Lý do (tối thiểu 20 ký tự)</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Mô tả chi tiết sự việc cần hỗ trợ..." />
        </label>
        <label className={styles.field}>
          <span>Link minh chứng (tùy chọn)</span>
          <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://..." inputMode="url" />
        </label>
        {error ? <em className={styles.error}>{error}</em> : null}
        <button type="submit" className={styles.submit}>
          Gửi phiếu
        </button>
      </form>

      <div className={styles.filterRow} role="group" aria-label="Lọc theo trạng thái">
        {(["ALL", "OPEN", "RESOLVED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={s === filter ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            aria-pressed={s === filter}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "Tất cả" : s === "OPEN" ? "Đang mở" : "Đã xử lý"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>Chưa có phiếu nào ở trạng thái này.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((t) => (
            <li key={t.ticketId} className={styles.item}>
              <button
                type="button"
                className={styles.itemHead}
                aria-expanded={expanded === t.ticketId}
                onClick={() => setExpanded(expanded === t.ticketId ? null : t.ticketId)}
              >
                <span className={styles.ticketId}>{t.ticketId}</span>
                <span className={styles.kind}>{t.kind === "REPORT" ? "Báo cáo" : "Tranh chấp"}</span>
                <span className={styles.order}>{t.orderId}</span>
                <span className={styles.status} data-status={t.status}>
                  {t.status === "OPEN" ? "Đang mở" : "Đã xử lý"}
                </span>
              </button>
              {expanded === t.ticketId ? (
                <div className={styles.detail}>
                  <p className={styles.reason}>{t.reason}</p>
                  {t.evidenceUrl ? (
                    <p className={styles.evidence}>
                      Minh chứng: <span>{t.evidenceUrl}</span>
                    </p>
                  ) : null}
                  <p className={styles.date}>{t.createdAt}</p>
                  {t.status === "OPEN" ? (
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={() => {
                        update(t.id, { status: "RESOLVED" });
                        onShowToast("Đã đánh dấu phiếu là đã xử lý (mock)!");
                      }}
                    >
                      Đánh dấu đã xử lý
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
