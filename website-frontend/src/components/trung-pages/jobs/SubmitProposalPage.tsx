"use client";

// Prototype Mode
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Send } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { mockJobs, type Job } from "../_mocks/mockJobs";
import { mockProposals, type Proposal } from "../_mocks/mockProposals";
import { KEYS } from "../_stores/keys";
import styles from "./SubmitProposalPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  jobId?: string;
};
export const PRICE_MIN = 50000;
export const PRICE_MAX = 100000000;
function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}
function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}
function loadJobs(): Job[] {
  if (typeof window === "undefined") return mockJobs;
  try {
    const raw = window.localStorage.getItem(KEYS.jobs);
    if (!raw) return mockJobs;
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p as Job[] : mockJobs;
  } catch {
    return mockJobs;
  }
}
function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return mockProposals;
  try {
    const raw = window.localStorage.getItem(KEYS.proposals);
    if (!raw) return mockProposals;
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p as Proposal[] : mockProposals;
  } catch {
    return mockProposals;
  }
}
export function validateProposalJob(raw: string): string | undefined {
  return raw ? undefined : "Please choose what to submit your proposal for!";
}
export function validateProposalBid(raw: string): string | undefined {
  const bid = Number(String(raw).replace(/[^\d]/g, ""));
  if (!Number.isFinite(bid) || bid <= 0) return "Package price must be a number greater than 0!";
  if (bid < PRICE_MIN) return `Minimum price is ${PRICE_MIN.toLocaleString("vi-VN")} ₫!`;
  if (bid > PRICE_MAX) return `Price exceeds ${PRICE_MAX.toLocaleString("vi-VN")} ₫ allowed!`;
  return undefined;
}
export function validateProposalDuration(raw: string): string | undefined {
  const duration = Number(raw);
  return !Number.isInteger(duration) || duration < 1 ? "Minimum implementation time 1 day!" : undefined;
}
export function validateProposalMessage(raw: string): string | undefined {
  return sanitizeText(raw).length < 20 ? "Please enter a detailed message of 20 characters or more!" : undefined;
}
export default function SubmitProposalPage({
  onNavigate,
  onShowToast,
  jobId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  // Lazy init is SSR-safe and remounts fresh on every shell navigation
  // (shell renders pages conditionally), so no post-mount sync is needed.
  const [jobs] = useState<Job[]>(() => loadJobs());
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [bidRaw, setBidRaw] = useState("");
  const [durationRaw, setDurationRaw] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    job?: string;
    bid?: string;
    duration?: string;
    message?: string;
  }>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      job: validateProposalJob(selectedJobId),
      bid: validateProposalBid(bidRaw),
      duration: validateProposalDuration(durationRaw),
      message: validateProposalMessage(message)
    };
    setErrors(next);
    if (next.job ?? next.bid ?? next.duration ?? next.message) return;
    const bid = Number(String(bidRaw).replace(/[^\d]/g, ""));
    const duration = Number(durationRaw);
    const cleanMsg = sanitizeText(message);
    const existing = loadProposals();
    const dup = existing.some(p => p.jobId === selectedJobId && p.providerName === tr("m1174") && p.status === "PENDING");
    if (dup) {
      setErrors({
        message: tr("m1209")
      });
      return;
    }
    const proposal: Proposal = {
      proposalId: `prop-${Date.now()}`,
      jobId: selectedJobId,
      providerName: tr("m1174"),
      bidPrice: bid,
      durationDays: duration,
      message: cleanMsg,
      status: "PENDING",
      createdAt: new Date().toISOString().slice(0, 10)
    };
    try {
      window.localStorage.setItem(KEYS.proposals, JSON.stringify([proposal, ...existing]));
    } catch {
      onShowToast(tr("m1175"));
      return;
    }
    onShowToast(tr("m1210"));
    onNavigate("proposal-review", {
      jobId: selectedJobId
    });
  };
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <Send size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1167")}</h1>
        <div style={{
        padding: "10px 14px",
        backgroundColor: "#fef3c7",
        border: "1px solid #fde68a",
        borderRadius: "8px",
        color: "#92400e",
        fontSize: "0.85rem",
        marginBottom: "16px",
        fontWeight: 500
      }}>{tr("m1196")}</div>
        <p className={styles.sub}>{tr("m1215")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1216")}</span>
            <select value={selectedJobId} onChange={e => {
            setSelectedJobId(e.target.value);
            if (errors.job) setErrors(prev => ({
              ...prev,
              job: validateProposalJob(e.target.value)
            }));
          }} onBlur={() => setErrors(prev => ({
            ...prev,
            job: validateProposalJob(selectedJobId)
          }))} aria-describedby={errors.job ? "proposal-job-error" : undefined}>
              <option value="">{tr("m1217")}</option>
              {jobs.map(j => <option key={j.jobId} value={j.jobId}>
                  {j.title}
                </option>)}
            </select>
            {errors.job ? <em id="proposal-job-error" className={styles.error}>
                {errors.job}
              </em> : null}
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{tr("m1218")}</span>
              <input value={bidRaw} onChange={e => {
              setBidRaw(e.target.value);
              if (errors.bid) setErrors(prev => ({
                ...prev,
                bid: validateProposalBid(e.target.value)
              }));
            }} onBlur={() => setErrors(prev => ({
              ...prev,
              bid: validateProposalBid(bidRaw)
            }))} placeholder="2000000" inputMode="numeric" aria-describedby={errors.bid ? "proposal-bid-error" : undefined} />
              {errors.bid ? <em id="proposal-bid-error" className={styles.error}>
                  {errors.bid}
                </em> : null}
            </label>
            <label className={styles.field}>
              <span>{tr("m1219")}</span>
              <input value={durationRaw} onChange={e => {
              setDurationRaw(e.target.value);
              if (errors.duration) setErrors(prev => ({
                ...prev,
                duration: validateProposalDuration(e.target.value)
              }));
            }} onBlur={() => setErrors(prev => ({
              ...prev,
              duration: validateProposalDuration(durationRaw)
            }))} placeholder="5" inputMode="numeric" aria-describedby={errors.duration ? "proposal-duration-error" : undefined} />
              {errors.duration ? <em id="proposal-duration-error" className={styles.error}>
                  {errors.duration}
                </em> : null}
            </label>
          </div>
          <label className={styles.field}>
            <span>{tr("m1220")}</span>
            <textarea value={message} onChange={e => {
            setMessage(e.target.value);
            if (errors.message) setErrors(prev => ({
              ...prev,
              message: validateProposalMessage(e.target.value)
            }));
          }} onBlur={() => setErrors(prev => ({
            ...prev,
            message: validateProposalMessage(message)
          }))} rows={5} placeholder={tr("m1211")} aria-describedby={errors.message ? "proposal-message-error" : undefined} />
            {errors.message ? <em id="proposal-message-error" className={styles.error}>
                {errors.message}
              </em> : null}
          </label>
          <button type="submit" className={styles.submit}>{tr("m1167")}</button>
        </form>
      </div>
    </main>;
}