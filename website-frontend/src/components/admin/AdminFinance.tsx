"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/components/webapp-bridge/backend";
import { AdminTable, ConfirmDialog, Notice, PageHeader, StatusBadge, cx, errorMessage, formatDate, formatMoney, useAdminArray } from "./ui";
import { adminHref } from "./adminNav";
import styles from "./admin.module.css";

type FeeVersion = {
  feePolicyVersionId: string;
  versionNo: number;
  successFeeRate: number;
  cancellationFeeRate: number;
  cancellationFeeCap: number;
  effectiveFrom: string;
  reason?: string;
};

type FeeAssessment = {
  feeAssessmentId: string;
  orderId: string;
  feeType: string;
  chargedParty: string;
  amount: number;
  outstandingAmount: number;
  status: string;
};

type Payout = {
  payoutId: string;
  payoutCode: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: string;
  externalReference?: string;
  failureReason?: string;
  createdAt: string;
};

type ReconciliationCase = {
  caseType: string;
  referenceId: string;
  code?: string;
  orderId?: string;
  amount?: number;
  status: string;
  committedSteps: string[];
  pendingStep: string;
  ledgerTransactionId?: string;
  since?: string;
};

const PAYOUT_STATUSES = ["REQUESTED", "PROCESSING", "UNKNOWN", "PAID", "FAILED", "CANCELLED"];
const PAYOUT_ACTIONS = {
  REQUESTED: ["processing", "failed"],
  PROCESSING: ["paid", "failed", "unknown"],
  UNKNOWN: ["paid", "failed"],
} as const;
type PayoutAction = (typeof PAYOUT_ACTIONS)[keyof typeof PAYOUT_ACTIONS][number];
const ASSESSMENT_STATUSES = ["OUTSTANDING", "COLLECTED", "WAIVED"];

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export function FeePolicies() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const rate = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const versions = useAdminArray<FeeVersion>(adminApi.listFeeVersions, "feeVersions");
  const [assessmentStatus, setAssessmentStatus] = useState("OUTSTANDING");
  const assessments = useAdminArray<FeeAssessment>(() => adminApi.listFeeAssessments(assessmentStatus), assessmentStatus);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const effectiveFrom = field(data, "effectiveFrom");
    const reason = field(data, "reason");
    if (!reason) return setNotice({ tone: "error", message: t("reasonRequired") });
    setBusy(true);
    setNotice(null);
    try {
      await adminApi.createFeeVersion({
        successFeeRate: Number(field(data, "successFeeRate")),
        cancellationFeeRate: Number(field(data, "cancellationFeeRate")),
        cancellationFeeCap: Number(field(data, "cancellationFeeCap")),
        ...(effectiveFrom ? { effectiveFrom: new Date(effectiveFrom).toISOString() } : {}),
        reason,
      });
      form.reset();
      versions.reload();
      setNotice({ tone: "success", message: t("saved") });
    } catch (err) {
      setNotice({ tone: "error", message: errorMessage(err, t) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.stack}>
      <PageHeader title={t("fees")} />
      <form className={cx(styles.card, styles.cardPad, styles.form)} onSubmit={create}>
        <h2>{t("newFeeVersion")}</h2>
        <p>{t("rateHint")}</p>
        <div className={styles.filters}>
          <label className={styles.field}>{t("successRate")}<input required name="successFeeRate" type="number" min="0" max="0.5" step="0.0001" /></label>
          <label className={styles.field}>{t("cancellationRate")}<input required name="cancellationFeeRate" type="number" min="0" max="0.5" step="0.0001" /></label>
          <label className={styles.field}>{t("cancellationCap")}<input required name="cancellationFeeCap" type="number" min="0" step="1" /></label>
          <label className={styles.field}>{t("effectiveFrom")}<input name="effectiveFrom" type="datetime-local" /></label>
        </div>
        <label className={styles.field}>{t("reason")}<textarea required name="reason" /></label>
        {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
        <div><button className={cx(styles.btn, styles.btnPrimary)} type="submit" disabled={busy}>{t("createVersion")}</button></div>
      </form>
      <AdminTable list={versions} paginate={false} headers={[t("version"), t("successRate"), t("cancellationRate"), t("cancellationCap"), t("effectiveFrom"), t("reason")]}>
        {versions.items.map((version) => (
          <tr key={version.feePolicyVersionId}>
            <td>{version.versionNo}</td>
            <td>{rate.format(version.successFeeRate)}</td>
            <td>{rate.format(version.cancellationFeeRate)}</td>
            <td>{formatMoney(locale, version.cancellationFeeCap)}</td>
            <td>{formatDate(version.effectiveFrom, locale)}</td>
            <td>{version.reason || "—"}</td>
          </tr>
        ))}
      </AdminTable>
      <PageHeader title={t("feeAssessments")} />
      <label className={styles.field}>
        {t("status")}
        <select value={assessmentStatus} onChange={(e) => setAssessmentStatus(e.target.value)}>
          {ASSESSMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <AdminTable list={assessments} paginate={false} headers={[t("order"), t("feeType"), t("chargedParty"), t("amount"), t("outstanding"), t("status")]}>
        {assessments.items.map((fee) => (
          <tr key={fee.feeAssessmentId}>
            <td>{fee.orderId}</td><td>{fee.feeType}</td><td>{fee.chargedParty}</td>
            <td>{formatMoney(locale, fee.amount)}</td><td>{formatMoney(locale, fee.outstandingAmount)}</td>
            <td><StatusBadge status={fee.status} /></td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

export function AdminPayouts() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const [status, setStatus] = useState("REQUESTED");
  const list = useAdminArray<Payout>(() => adminApi.listPayouts(status), status);
  const [pending, setPending] = useState<{ payout: Payout; action: PayoutAction } | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <section className={styles.stack}>
      <PageHeader title={t("payouts")} sub={t("payoutSub")} />
      <label className={styles.field}>
        {t("status")}
        <select value={status} onChange={(e) => { setSaved(false); setStatus(e.target.value); }}>
          {PAYOUT_STATUSES.map((state) => <option key={state}>{state}</option>)}
        </select>
      </label>
      {saved && <Notice tone="success">{t("saved")}</Notice>}
      <AdminTable list={list} paginate={false} headers={[t("reference"), t("bankAccount"), t("amount"), t("status"), t("createdAt"), t("actions")]}>
        {list.items.map((payout) => (
          <tr key={payout.payoutId}>
            <td>{payout.payoutCode}<div className={styles.cellSub}>{payout.externalReference}</div></td>
            <td>{payout.bankCode} · {payout.accountNumber}<div className={styles.cellSub}>{payout.accountName}</div></td>
            <td>{formatMoney(locale, payout.amount, payout.currency)}</td>
            <td><StatusBadge status={payout.status} /><div className={styles.cellSub}>{payout.failureReason}</div></td>
            <td>{formatDate(payout.createdAt, locale)}</td>
            <td>
              <div className={styles.badgeRow}>
                {PAYOUT_ACTIONS[payout.status as keyof typeof PAYOUT_ACTIONS]?.map((action) => (
                  <button key={action} className={styles.btn} type="button" onClick={() => { setSaved(false); setPending({ payout, action }); }}>{t(action)}</button>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
      {pending && <PaymentOperation
        title={t(pending.action)}
        description={pending.payout.payoutCode + " · " + formatMoney(locale, pending.payout.amount, pending.payout.currency)}
        requireReference={pending.action === "paid" || pending.action === "failed"}
          requireEvidence={pending.action === "paid" || pending.action === "failed"}
        onSubmit={(input) => adminApi.markPayout(pending.payout.payoutId, pending.action, input)}
        onCancel={() => setPending(null)}
        onDone={() => { setPending(null); setSaved(true); list.reload(); }}
      />}
    </section>
  );
}

export function AdminReconciliation() {
  const t = useTranslations("adminOperations");
  const locale = useLocale();
  const list = useAdminArray<ReconciliationCase>(adminApi.listReconciliationCases, "reconciliation");
  const [pending, setPending] = useState<ReconciliationCase | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isTopUp = pending?.caseType === "TOP_UP_UNKNOWN";
  const start = (item: ReconciliationCase) => {
    setNotice(null);
    setPending(item);
  };

  return (
    <section className={styles.stack}>
      <PageHeader title={t("reconciliation")} />
      {notice && <Notice tone="success">{notice}</Notice>}
      <AdminTable list={list} paginate={false} headers={[t("reference"), t("status"), t("amount"), t("committedSteps"), t("pendingStep"), t("createdAt"), t("actions")]}>
        {list.items.map((item) => (
          <tr key={item.referenceId}>
            <td>{item.code ?? item.orderId ?? item.referenceId}<div className={styles.cellSub}>{item.caseType}</div></td>
            <td><StatusBadge status={item.status} /></td>
            <td>{formatMoney(locale, item.amount)}</td>
            <td>{item.committedSteps.join(", ")}<div className={styles.cellSub}>{item.ledgerTransactionId}</div></td>
            <td>{item.pendingStep}</td>
            <td>{formatDate(item.since, locale)}</td>
            <td>
              {item.caseType === "TOP_UP_UNKNOWN" && <button className={styles.btn} type="button" onClick={() => start(item)}>{t("resolveTopUp")}</button>}
              {item.caseType === "ORDER_SYNC_FAILED" && item.orderId && <button className={styles.btn} type="button" onClick={() => start(item)}>{t("retryOrderSync")}</button>}
              {item.caseType.startsWith("PAYOUT_") && <Link className={styles.btn} href={adminHref(locale, "payouts")}>{t("payouts")}</Link>}
            </td>
          </tr>
        ))}
      </AdminTable>
      {pending && <PaymentOperation
        title={t(isTopUp ? "resolveTopUp" : "retryOrderSync")}
        description={pending.code ?? pending.orderId ?? pending.referenceId}
        requireOutcome={isTopUp}
        requireReference={isTopUp}
          requireEvidence={isTopUp}
        onSubmit={({ reason, result, externalReference, sourceEvidence }) => {
          if (isTopUp && result && externalReference) return adminApi.resolveTopUp(pending.referenceId, { reason, result, externalReference, sourceEvidence });
          if (!isTopUp && pending.orderId) return adminApi.retryOrderSync(pending.orderId, { reason });
          return Promise.reject(new Error(t("invalidCase")));
        }}
        onCancel={() => setPending(null)}
        onDone={() => { setPending(null); setNotice(t(isTopUp ? "saved" : "retryQueued")); list.reload(); }}
      />}
    </section>
  );
}

type PaymentEvidence = { sourceEvidence?: Record<string,string>; reason: string; externalReference?: string; result?: "SUCCEEDED" | "FAILED" };

function PaymentOperation({
  title, description, requireReference, requireOutcome, requireEvidence, onSubmit, onCancel, onDone,
}: {
  title: string;
  description: string;
  requireReference?: boolean;
  requireOutcome?: boolean;
  requireEvidence?: boolean;
  onSubmit: (input: PaymentEvidence) => Promise<unknown>;
  onCancel: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("adminOperations");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [sourceEvidence, setSourceEvidence] = useState<Record<string,string> | null>(null);
  const [result, setResult] = useState<"" | "SUCCEEDED" | "FAILED">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = Boolean(reason.trim() && (!requireReference || reference.trim()) && (!requireOutcome || result) && (!requireEvidence || sourceEvidence));

  const confirm = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        reason: reason.trim(),
        ...(reference.trim() && { externalReference: reference.trim() }),
        ...(result && { result }),
        ...(sourceEvidence && {sourceEvidence}),
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      title={title}
      confirmLabel={t("confirm")}
      busy={busy}
      disabled={!canSubmit}
      onConfirm={confirm}
      onCancel={onCancel}
      body={<div className={styles.form}>
        <p>{description}</p>
        {requireOutcome && <label className={styles.field}>
          {t("gatewayResult")}
          <select required disabled={busy} value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
            <option value="">{t("chooseResult")}</option>
            <option value="SUCCEEDED">{t("gatewaySuccess")}</option>
            <option value="FAILED">{t("gatewayFailed")}</option>
          </select>
        </label>}
        {requireEvidence && <label className={styles.field}>X?c nh?n c? ch? k? t? ng?n h?ng/??i t?c
          <input type="file" accept="application/json,.json" disabled={busy} onChange={async e=>{setSourceEvidence(null);try{
            const file=e.target.files?.[0];if(!file||file.size>65536)throw new Error('Invalid evidence file');const value=JSON.parse(await file.text());
            if(!value||Array.isArray(value)||typeof value!=='object'||Object.values(value).some(v=>typeof v!=='string'))throw new Error('Invalid signed evidence');setSourceEvidence(value);
          }catch(err){setError(errorMessage(err,t));}}}/></label>}
        {requireReference && <label className={styles.field}>
          {t("bankReference")}
          <input required value={reference} onChange={(e) => setReference(e.target.value)} disabled={busy} />
        </label>}
        <label className={styles.field}>
          {t("reason")}
          <textarea required value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
      </div>}
    />
  );
}
