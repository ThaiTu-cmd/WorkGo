"use client";
// Trung Tâm Khiếu Nại Demo

import { useTranslations } from "next-intl";
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
export default function DisputeCenterPage({
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const quotaToast = useCallback(() => onShowToast(tr("m1175")), [onShowToast]);
  const seed = mockDisputes.map(d => ({
    ...d,
    id: d.ticketId
  }));
  const {
    items,
    add,
    update
  } = useLocalList<Dispute & {
    id: string;
  }>(KEYS.disputes, seed, quotaToast);
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
      setError(tr("m1400"));
      return;
    }
    if (cleanReason.length < 20) {
      setError(tr("m1401"));
      return;
    }
    if (cleanEvidence !== "") {
      try {
        const u = new URL(cleanEvidence);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad");
      } catch {
        setError(tr("m1402"));
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
      createdAt: new Date().toISOString().slice(0, 10)
    });
    setOrderId("");
    setReason("");
    setEvidenceUrl("");
    onShowToast(tr("m1403"));
  };
  const visible = items.filter(t => filter === "ALL" ? true : t.status === filter);
  return <main className={styles.wrap}>
      <h1 className={styles.title}>
        <ShieldAlert size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1410")}</h1>
      <div style={{
      padding: "10px 14px",
      backgroundColor: "#fef3c7",
      border: "1px solid #fde68a",
      borderRadius: "8px",
      color: "#92400e",
      fontSize: "0.85rem",
      marginBottom: "16px",
      fontWeight: 500
    }}>{tr("m1411")}</div>
      <p className={styles.sub}>{tr("m1412")}</p>

      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span>{tr("m1413")}</span>
            <select value={kind} onChange={e => setKind(e.target.value as DisputeKind)}>
              <option value="REPORT">{tr("m1414")}</option>
              <option value="DISPUTE">{tr("m1415")}</option>
            </select>
          </label>
          <label className={styles.field}>
            <span>{tr("m1416")}</span>
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="ORD-1042" />
          </label>
        </div>
        <label className={styles.field}>
          <span>{tr("m1417")}</span>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} placeholder={tr("m1404")} />
        </label>
        <label className={styles.field}>
          <span>{tr("m1418")}</span>
          <input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://..." inputMode="url" />
        </label>
        {error ? <em className={styles.error}>{error}</em> : null}
        <button type="submit" className={styles.submit}>{tr("m1419")}</button>
      </form>

      <div className={styles.filterRow} role="group" aria-label={tr("m1405")}>
        {(["ALL", "OPEN", "RESOLVED"] as const).map(s => <button key={s} type="button" className={s === filter ? `${styles.chip} ${styles.chipActive}` : styles.chip} aria-pressed={s === filter} onClick={() => setFilter(s)}>
            {s === "ALL" ? tr("m142") : s === "OPEN" ? tr("m1406") : tr("m1407")}
          </button>)}
      </div>

      {visible.length === 0 ? <p className={styles.empty}>{tr("m1421")}</p> : <ul className={styles.list}>
          {visible.map(t => <li key={t.ticketId} className={styles.item}>
              <button type="button" className={styles.itemHead} aria-expanded={expanded === t.ticketId} onClick={() => setExpanded(expanded === t.ticketId ? null : t.ticketId)}>
                <span className={styles.ticketId}>{t.ticketId}</span>
                <span className={styles.kind}>{t.kind === "REPORT" ? tr("m1408") : tr("m59")}</span>
                <span className={styles.order}>{t.orderId}</span>
                <span className={styles.status} data-status={t.status}>
                  {t.status === "OPEN" ? tr("m1406") : tr("m1407")}
                </span>
              </button>
              {expanded === t.ticketId ? <div className={styles.detail}>
                  <p className={styles.reason}>{t.reason}</p>
                  {t.evidenceUrl ? <p className={styles.evidence}>{tr("m1424")}<span>{t.evidenceUrl}</span>
                    </p> : null}
                  <p className={styles.date}>{t.createdAt}</p>
                  {t.status === "OPEN" ? <button type="button" className={styles.ghost} onClick={() => {
            update(t.id, {
              status: "RESOLVED"
            });
            onShowToast(tr("m1409"));
          }}>{tr("m1425")}</button> : null}
                </div> : null}
            </li>)}
        </ul>}
    </main>;
}