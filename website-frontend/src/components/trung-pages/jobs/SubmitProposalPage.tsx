"use client";

// Prototype Mode
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { jobApi, useAuthToken } from "../../webapp-bridge/backend";
import { type Job } from "../_mocks/mockJobs";
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

// Validators return a message from the "misc" dictionary, so they take the page's translator.
type Tr = (key: string, values?: Record<string, string | number>) => string;

export function validateProposalJob(raw: string, tr: Tr): string | undefined {
  return raw ? undefined : tr("m1673");
}

export function validateProposalBid(raw: string, tr: Tr): string | undefined {
  const bid = Number(String(raw).replace(/[^\d]/g, ""));
  if (!Number.isFinite(bid) || bid <= 0) return tr("m1670");
  if (bid < PRICE_MIN) return tr("m1671", { p0: PRICE_MIN.toLocaleString("vi-VN") });
  if (bid > PRICE_MAX) return tr("m1672", { p0: PRICE_MAX.toLocaleString("vi-VN") });
  return undefined;
}

export function validateProposalDuration(raw: string, tr: Tr): string | undefined {
  const duration = Number(raw);
  return !Number.isInteger(duration) || duration < 1 ? tr("m1674") : undefined;
}

export function validateProposalMessage(raw: string, tr: Tr): string | undefined {
  return sanitizeText(raw).length < 20 ? tr("m1675") : undefined;
}

export default function SubmitProposalPage({
  onNavigate,
  onShowToast,
  jobId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
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

  useEffect(() => {
    let cancelled = false;
    jobApi.searchJobs({ page: 0, size: 50 }).then((res: { result?: { data?: unknown[] } }) => {
      if (cancelled) return;
      const apiList = (res?.result?.data || (Array.isArray(res?.result) ? res.result : [])) as Array<{
        jobId: string;
        title: string;
      }>;
      if (Array.isArray(apiList)) {
        setJobs(apiList.map(j => ({
          jobId: j.jobId,
          title: j.title,
          description: "",
          budget: 0,
          type: "DIGITAL",
          clientName: "",
          bidsCount: 0,
          createdAt: ""
        })));
      }
    }).catch(() => {
      // Backend not running or empty
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      job: validateProposalJob(selectedJobId, tr),
      bid: validateProposalBid(bidRaw, tr),
      duration: validateProposalDuration(durationRaw, tr),
      message: validateProposalMessage(message, tr)
    };
    setErrors(next);
    if (next.job ?? next.bid ?? next.duration ?? next.message) return;

    if (!token) {
      onShowToast("Vui lòng đăng nhập để gửi đề xuất việc làm.");
      return;
    }

    const bid = Number(String(bidRaw).replace(/[^\d]/g, ""));
    const duration = Number(durationRaw);
    const cleanMsg = sanitizeText(message);
    setSubmitting(true);

    try {
      const appRes = await jobApi.applyJob(selectedJobId, { message: cleanMsg });
      const applicationId = appRes?.result?.applicationId;
      if (!applicationId) {
        throw new Error(appRes?.message || "Không thể khởi tạo ứng tuyển cho công việc này.");
      }
      await jobApi.submitProposal(applicationId, {
        price: bid,
        estimatedDays: duration,
        message: cleanMsg,
      });
      onShowToast(tr("m1210"));
      onNavigate("proposal-review", {
        jobId: selectedJobId
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || tr("m1140");
      onShowToast(msg);
      setErrors(prev => ({
        ...prev,
        message: msg
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <Send size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1167")}
        </h1>
        <p className={styles.sub}>{tr("m1215")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1216")}</span>
            <select
              value={selectedJobId}
              onChange={e => {
                setSelectedJobId(e.target.value);
                if (errors.job)
                  setErrors(prev => ({
                    ...prev,
                    job: validateProposalJob(e.target.value, tr)
                  }));
              }}
              onBlur={() =>
                setErrors(prev => ({
                  ...prev,
                  job: validateProposalJob(selectedJobId, tr)
                }))
              }
              aria-describedby={errors.job ? "proposal-job-error" : undefined}
            >
              <option value="">{tr("m1217")}</option>
              {jobs.map(j => (
                <option key={j.jobId} value={j.jobId}>
                  {j.title}
                </option>
              ))}
            </select>
            {errors.job ? (
              <em id="proposal-job-error" className={styles.error}>
                {errors.job}
              </em>
            ) : null}
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{tr("m1218")}</span>
              <input
                value={bidRaw}
                onChange={e => {
                  setBidRaw(e.target.value);
                  if (errors.bid)
                    setErrors(prev => ({
                      ...prev,
                      bid: validateProposalBid(e.target.value, tr)
                    }));
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    bid: validateProposalBid(bidRaw, tr)
                  }))
                }
                placeholder="2000000"
                inputMode="numeric"
                aria-describedby={errors.bid ? "proposal-bid-error" : undefined}
              />
              {errors.bid ? (
                <em id="proposal-bid-error" className={styles.error}>
                  {errors.bid}
                </em>
              ) : null}
            </label>
            <label className={styles.field}>
              <span>{tr("m1219")}</span>
              <input
                value={durationRaw}
                onChange={e => {
                  setDurationRaw(e.target.value);
                  if (errors.duration)
                    setErrors(prev => ({
                      ...prev,
                      duration: validateProposalDuration(e.target.value, tr)
                    }));
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    duration: validateProposalDuration(durationRaw, tr)
                  }))
                }
                placeholder="5"
                inputMode="numeric"
                aria-describedby={errors.duration ? "proposal-duration-error" : undefined}
              />
              {errors.duration ? (
                <em id="proposal-duration-error" className={styles.error}>
                  {errors.duration}
                </em>
              ) : null}
            </label>
          </div>
          <label className={styles.field}>
            <span>{tr("m1220")}</span>
            <textarea
              value={message}
              onChange={e => {
                setMessage(e.target.value);
                if (errors.message)
                  setErrors(prev => ({
                    ...prev,
                    message: validateProposalMessage(e.target.value, tr)
                  }));
              }}
              onBlur={() =>
                setErrors(prev => ({
                  ...prev,
                  message: validateProposalMessage(message, tr)
                }))
              }
              rows={5}
              placeholder={tr("m1211")}
              aria-describedby={errors.message ? "proposal-message-error" : undefined}
            />
            {errors.message ? (
              <em id="proposal-message-error" className={styles.error}>
                {errors.message}
              </em>
            ) : null}
          </label>
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? tr("m1143") : tr("m1167")}
          </button>
        </form>
      </div>
    </main>
  );
}
