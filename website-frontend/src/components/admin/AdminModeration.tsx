"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { adminApi, decodeToken, hasRole, useAuthToken } from "@/components/shell/backend";
import { disputeDecisionBody, moderationActions, moderationDetailVisible } from "./moderationPolicy";
import { AdminTable, Notice, PageHeader, StatusBadge, cx, downloadAdminFile, errorMessage, formatDate, formatMoney, useAdminList } from "./ui";
import styles from "./admin.module.css";

type Section = "jobs" | "reviews" | "reports" | "disputes";
type Entry = Record<string, unknown> & {
  job?: { jobId: string; title: string; status: string; clientId: string; budgetMin?: number; budgetMax?: number; currency?: string; createdAt?: string };
  jobId?: string;
  reviewId?: string;
  reportId?: string;
  disputeId?: string;
  orderId?: string;
  targetId?: string;
  targetType?: string;
  comment?: string;
  description?: string;
  reason?: string;
  rating?: number;
  moderationStatus?: string;
  moderationHidden?: boolean;
  status?: string;
  version?: number;
  createdAt?: string;
  assignedAdminId?: string;
  evidenceRequest?: string;
  decisionId?: string;
  decision?: Decision;
};
type Evidence = { id: string; mimeType: string; sizeBytes: number; createdAt: string; uploaderId: string };
type Decision = { decisionId: string; version: number; operation: string; faultType: string; lateCycles: number; supersedesDecisionId?: string; executionStatus: string; paymentStatus: string; orderStatus: string; lastError?: string; terminalConflict?: boolean };
type Detail = { id: string; userId?: string; entry: Entry; evidence: Evidence[]; decision?: Decision | null };
type History = { id: string; actorId: string; action: string; createdAt: string; correlationId?: string };

const listApi = {
  jobs: adminApi.listModerationJobs,
  reviews: adminApi.listModerationReviews,
  reports: adminApi.listModerationReports,
  disputes: adminApi.listModerationDisputes,
};
const detailApi = {
  jobs: adminApi.getModerationJob,
  reviews: adminApi.getModerationReview,
  reports: adminApi.getModerationReport,
  disputes: adminApi.getModerationDispute,
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function entryId(section: Section, entry: Entry) {
  if (section === "jobs") return entry.job?.jobId ?? entry.jobId;
  if (section === "reviews") return entry.reviewId;
  if (section === "reports") return entry.reportId;
  return entry.disputeId;
}

export default function AdminModeration({ section }: { section: Section }) {
  const t = useTranslations("adminModeration");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = useAuthToken();
  const roles = ["ADMIN", "SUPER_ADMIN"].filter(role => hasRole(token, role));
  const userId = decodeToken(token)?.userId as string | undefined;
  const list = useAdminList<Entry>(page => listApi[section](page), `${section}:${userId}`);
  const candidate = searchParams.get("id");
  const selectedId = candidate && uuid.test(candidate) ? candidate : null;
  const [reload, setReload] = useState(0);
  const requestKey = `${section}:${selectedId}:${userId}:${reload}`;
  const [loaded, setLoaded] = useState<{ key: string; detail: Detail | null; error: string | null }>({ key: "", detail: null, error: null });
  const [pending, setPending] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [operation, setOperation] = useState("REJECT");
  const [branch, setBranch] = useState("CLIENT");
  const [faultType, setFaultType] = useState("NONE");
  const [lateCycles, setLateCycles] = useState(1);
  const [supersedesDecisionId, setSupersedesDecisionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const history = useAdminList<History>(page => selectedId
    ? section === "jobs" ? adminApi.getModerationJobHistory(selectedId, page) : adminApi.listAuditLogs("trust", { targetId: selectedId, page })
    : Promise.resolve({ result: { data: [], totalElements: 0, totalPages: 0 } }), `${section}:${selectedId}:${userId}`);

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    (async () => {
      const response = await detailApi[section](selectedId);
      const entry = response.result as Entry;
      let decision: Decision | null = null;
      let evidence: Evidence[] = [];
      if (section === "disputes") {
        if (entry.decisionId) decision = (await adminApi.getDisputeDecision(selectedId)).result as Decision;
        if (entry.assignedAdminId === userId) evidence = (await adminApi.listDisputeEvidence(selectedId)).result as Evidence[];
      }
      if (alive) setLoaded({ key: requestKey, detail: { id: selectedId, userId, entry, decision, evidence }, error: null });
    })().catch(err => { if (alive) setLoaded({ key: requestKey, detail: null, error: errorMessage(err) }); });
    return () => { alive = false; };
  }, [section, selectedId, requestKey, userId]);

  const select = (id: string) => {
    setPending(null);
    setNotice(null);
    router.replace(`${pathname}?id=${encodeURIComponent(id)}`);
  };
  const loadingDetail = Boolean(selectedId && loaded.key !== requestKey);
  const detailError = loaded.key === requestKey ? loaded.error : null;
  const current = moderationDetailVisible(loaded.detail, selectedId, userId) && loaded.key === requestKey ? loaded.detail : null;
  const entry = current?.entry;
  const actions = moderationActions(section, entry ? { ...entry, decision: current?.decision } : null, roles, userId);
  const decisionBody = entry?.version == null ? null : disputeDecisionBody({ reason, evidenceSummary, expectedVersion: entry.version,
    operation, branch, faultType, lateCycles, supersedesDecisionId });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entry || !selectedId || !pending || !reason.trim() || busy || entry.version == null || pending === "resolve" && !decisionBody) return;
    setBusy(true);
    setNotice(null);
    const body = { reason: reason.trim(), expectedVersion: entry.version };
    try {
      if (section === "jobs") await adminApi.moderateJob(selectedId, { ...body, hidden: pending === "hide" });
      if (section === "reviews") await adminApi.moderateReview(selectedId, { ...body, status: pending });
      if (section === "reports") await adminApi.updateReport(selectedId, { ...body, status: pending });
      if (section === "disputes") {
        if (pending === "takeOver") await adminApi.takeOverDispute(selectedId, body);
        if (pending === "requestEvidence") await adminApi.requestDisputeEvidence(selectedId, body);
        if (pending === "resolve") await adminApi.resolveDispute(selectedId, decisionBody);
        if (pending === "retry" && current?.decision) await adminApi.retryDecision(current.decision.decisionId, {
          reason: body.reason, expectedVersion: current.decision.version,
        });
      }
      setPending(null);
      setReason("");
      setEvidenceSummary("");
      setNotice({ tone: "success", message: t("saved") });
      setReload(value => value + 1);
      list.reload();
      history.reload();
    } catch (err) {
      setNotice({ tone: "error", message: errorMessage(err) });
      setReload(value => value + 1);
      list.reload();
      history.reload();
    } finally { setBusy(false); }
  };

  const download = async (file: Evidence) => {
    setDownloading(file.id);
    setNotice(null);
    try {
      const blob = await adminApi.downloadDisputeEvidence(file.id);
      downloadAdminFile(blob, `dispute-evidence-${file.id}`);
    } catch (err) { setNotice({ tone: "error", message: errorMessage(err) }); }
    finally { setDownloading(null); }
  };

  return <section className={styles.stack}>
    <PageHeader title={t(section)} />
    <AdminTable list={list} headers={[t("item"), t("status"), t("createdAt"), t("actions")]}>
      {list.items.map(item => {
        const id = entryId(section, item);
        if (!id) return null;
        const status = section === "jobs" ? (item.moderationHidden ? "HIDDEN" : item.job?.status) : section === "reviews" ? item.moderationStatus : item.status;
        return <tr key={id}>
          <td><strong>{section === "jobs" ? item.job?.title : section === "reviews" ? `${item.rating ?? "—"}/5` : item.reason ?? id}</strong><div className={styles.cellSub}>{id}</div></td>
          <td><StatusBadge status={status} /></td>
          <td>{formatDate(item.createdAt ?? item.job?.createdAt, locale)}</td>
          <td><button type="button" className={styles.btn} onClick={() => select(id)}>{t("open")}</button></td>
        </tr>;
      })}
    </AdminTable>
    {selectedId && <div className={cx(styles.card, styles.cardPad, styles.stack)}>
      <h2>{t("detail")}</h2>
      {loadingDetail && <p role="status">{t("loading")}</p>}
      {detailError && <Notice tone="error">{detailError} <button type="button" className={styles.btn} onClick={() => setReload(value => value + 1)}>{t("retryLoad")}</button></Notice>}
      {entry && <>
        <p><strong>{section === "jobs" ? entry.job?.title : entry.reason ?? selectedId}</strong> · <StatusBadge status={section === "reviews" ? entry.moderationStatus : entry.status ?? entry.job?.status} /></p>
        <p>{t("id")}: {selectedId} · {t("version")}: {entry.version ?? "—"}</p>
        {section === "jobs" && <p>{t("client")}: {entry.job?.clientId} · {t("budget")}: {formatMoney(locale, entry.job?.budgetMin, entry.job?.currency)}–{formatMoney(locale, entry.job?.budgetMax, entry.job?.currency)}</p>}
        {section === "reviews" && <p>{t("order")}: {entry.orderId} · {t("comment")}: {entry.comment || "—"}</p>}
        {section === "reports" && <p>{t("target")}: {entry.targetType} / {entry.targetId} · {entry.description || "—"}</p>}
        {section === "disputes" && <>
          <p>{t("order")}: {entry.orderId} · {t("assigned")}: {entry.assignedAdminId || "—"}</p>
          <p>{entry.description || "—"}</p>
          {entry.evidenceRequest && <p>{t("evidenceRequest")}: {entry.evidenceRequest}</p>}
          <h3>{t("evidence")}</h3>
          {current?.evidence.length ? <ul>{current.evidence.map(file => <li key={file.id}>
            {file.mimeType} · {file.sizeBytes} {t("bytes")} · {formatDate(file.createdAt, locale)} · {file.uploaderId}{" "}
            <button type="button" className={styles.btn} disabled={downloading !== null} onClick={() => void download(file)}>{t("download")}</button>
          </li>)}</ul> : <p>{t(entry.assignedAdminId === userId ? "noEvidence" : "evidenceAssignedOnly")}</p>}
          {current?.decision && <div className={styles.card}>
            <h3>{t("decision")}</h3>
            <p>{current.decision.operation} · {current.decision.executionStatus}</p>
            <p>{t("faultType")}: {current.decision.faultType}{current.decision.lateCycles ? ` · ${t("lateCycles")}: ${current.decision.lateCycles}` : ""}</p>
            {current.decision.supersedesDecisionId && <p>{t("supersedesDecisionId")}: {current.decision.supersedesDecisionId}</p>}
            <p>{t("paymentStep")}: {current.decision.paymentStatus} · {t("orderStep")}: {current.decision.orderStatus}</p>
            {current.decision.lastError && <p role="alert">{current.decision.lastError}</p>}
          </div>}
        </>}
        <h3>{t("history")}</h3>
        <p>{t(roles.includes("SUPER_ADMIN") ? "historyAll" : "historyOwn")}</p>
        <AdminTable list={history} headers={[t("createdAt"), t("action"), t("actor"), t("correlationId")]}>
          {history.items.map(row => <tr key={row.id}>
            <td>{formatDate(row.createdAt, locale)}</td><td>{row.action}</td><td>{row.actorId}</td><td>{row.correlationId || "—"}</td>
          </tr>)}
        </AdminTable>
        {actions.length > 0 && <div className={styles.badgeRow}>{actions.map(action => <button key={action} type="button" className={styles.btn} onClick={() => { setPending(action); setReason(""); setFaultType("NONE"); setLateCycles(1); setSupersedesDecisionId(""); setNotice(null); }}>{t(action)}</button>)}</div>}
        {pending && <form className={styles.form} onSubmit={event => void submit(event)}>
          <h3>{t(pending)}</h3>
          <label className={styles.field}>{t("reason")}<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} required /></label>
          {pending === "resolve" && <>
            <label className={styles.field}>{t("operation")}<select value={operation} onChange={event => setOperation(event.target.value)}><option value="REJECT">{t("rejectCase")}</option><option value="RELEASE">{t("release")}</option><option value="REFUND">{t("refund")}</option></select></label>
            {operation === "REFUND" && <label className={styles.field}>{t("faultParty")}<select value={branch} onChange={event => setBranch(event.target.value)}><option value="CLIENT">CLIENT</option><option value="PROVIDER">PROVIDER</option></select></label>}
            <label className={styles.field}>{t("faultType")}<select value={faultType} onChange={event => setFaultType(event.target.value)}>
              {(["NONE", "LATE", "ABANDONMENT", "CAPABILITY", "CORRECTION"] as const).map(value => <option key={value} value={value}>{t(`fault${value}`)}</option>)}
            </select></label>
            <p>{t("faultRules")}</p>
            {faultType === "LATE" && <label className={styles.field}>{t("lateCycles")}<input type="number" min={1} max={6} value={lateCycles} onChange={event => setLateCycles(Number(event.target.value))} /></label>}
            {faultType === "CORRECTION" && <label className={styles.field}>{t("supersedesDecisionId")}<input type="text" value={supersedesDecisionId} onChange={event => setSupersedesDecisionId(event.target.value)} /></label>}
            <label className={styles.field}>{t("evidenceSummary")}<textarea value={evidenceSummary} onChange={event => setEvidenceSummary(event.target.value)} maxLength={2000} required /></label>
          </>}
          <div className={styles.badgeRow}>
            <button type="submit" className={cx(styles.btn, styles.btnPrimary)} disabled={busy || !reason.trim() || (pending === "resolve" && !decisionBody)}>{t("confirm")}</button>
            <button type="button" className={styles.btn} disabled={busy} onClick={() => setPending(null)}>{t("cancel")}</button>
          </div>
        </form>}
      </>}
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
    </div>}
  </section>;
}
