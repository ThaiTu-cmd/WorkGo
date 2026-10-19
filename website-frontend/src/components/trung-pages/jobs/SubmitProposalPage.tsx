"use client";

import { useState } from "react";
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
    return Array.isArray(p) ? (p as Job[]) : mockJobs;
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
    return Array.isArray(p) ? (p as Proposal[]) : mockProposals;
  } catch {
    return mockProposals;
  }
}

export function validateProposalJob(raw: string): string | undefined {
  return raw ? undefined : "Vui lòng chọn việc cần gửi đề xuất!";
}

export function validateProposalBid(raw: string): string | undefined {
  const bid = Number(String(raw).replace(/[^\d]/g, ""));
  if (!Number.isFinite(bid) || bid <= 0) return "Giá gói phải là số lớn hơn 0!";
  if (bid < PRICE_MIN) return `Giá tối thiểu là ${PRICE_MIN.toLocaleString("vi-VN")} ₫!`;
  if (bid > PRICE_MAX) return `Giá vượt quá ${PRICE_MAX.toLocaleString("vi-VN")} ₫ cho phép!`;
  return undefined;
}

export function validateProposalDuration(raw: string): string | undefined {
  const duration = Number(raw);
  return !Number.isInteger(duration) || duration < 1 ? "Thời gian thực hiện tối thiểu 1 ngày!" : undefined;
}

export function validateProposalMessage(raw: string): string | undefined {
  return sanitizeText(raw).length < 20 ? "Vui lòng nhập lời nhắn chi tiết từ 20 ký tự trở lên!" : undefined;
}

export default function SubmitProposalPage({ onNavigate, onShowToast, jobId }: TrungPageProps) {
  // Lazy init is SSR-safe and remounts fresh on every shell navigation
  // (shell renders pages conditionally), so no post-mount sync is needed.
  const [jobs] = useState<Job[]>(() => loadJobs());
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [bidRaw, setBidRaw] = useState("");
  const [durationRaw, setDurationRaw] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ job?: string; bid?: string; duration?: string; message?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      job: validateProposalJob(selectedJobId),
      bid: validateProposalBid(bidRaw),
      duration: validateProposalDuration(durationRaw),
      message: validateProposalMessage(message),
    };
    setErrors(next);
    if (next.job ?? next.bid ?? next.duration ?? next.message) return;

    const bid = Number(String(bidRaw).replace(/[^\d]/g, ""));
    const duration = Number(durationRaw);
    const cleanMsg = sanitizeText(message);

    const existing = loadProposals();
    const dup = existing.some((p) => p.jobId === selectedJobId && p.providerName === "Bạn" && p.status === "PENDING");
    if (dup) {
      setErrors({ message: "Bạn đã gửi đề xuất cho việc này!" });
      return;
    }
    const proposal: Proposal = {
      proposalId: `prop-${Date.now()}`,
      jobId: selectedJobId,
      providerName: "Bạn",
      bidPrice: bid,
      durationDays: duration,
      message: cleanMsg,
      status: "PENDING",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    try {
      window.localStorage.setItem(KEYS.proposals, JSON.stringify([proposal, ...existing]));
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast("Đã gửi đề xuất cho client!");
    onNavigate("proposal-review", { jobId: selectedJobId });
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Gửi đề xuất</h1>
        <p className={styles.sub}>Chào giá và thuyết phục client chọn bạn thực hiện việc này.</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Chọn việc</span>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                if (errors.job) setErrors((prev) => ({ ...prev, job: validateProposalJob(e.target.value) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, job: validateProposalJob(selectedJobId) }))}
              aria-describedby={errors.job ? "proposal-job-error" : undefined}
            >
              <option value="">-- Chọn việc --</option>
              {jobs.map((j) => (
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
              <span>Giá chào (₫)</span>
              <input
                value={bidRaw}
                onChange={(e) => {
                  setBidRaw(e.target.value);
                  if (errors.bid) setErrors((prev) => ({ ...prev, bid: validateProposalBid(e.target.value) }));
                }}
                onBlur={() => setErrors((prev) => ({ ...prev, bid: validateProposalBid(bidRaw) }))}
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
              <span>Số ngày thực hiện</span>
              <input
                value={durationRaw}
                onChange={(e) => {
                  setDurationRaw(e.target.value);
                  if (errors.duration)
                    setErrors((prev) => ({ ...prev, duration: validateProposalDuration(e.target.value) }));
                }}
                onBlur={() => setErrors((prev) => ({ ...prev, duration: validateProposalDuration(durationRaw) }))}
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
            <span>Lời nhắn (tối thiểu 20 ký tự)</span>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message)
                  setErrors((prev) => ({ ...prev, message: validateProposalMessage(e.target.value) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, message: validateProposalMessage(message) }))}
              rows={5}
              placeholder="Kinh nghiệm và phương án thực hiện của bạn..."
              aria-describedby={errors.message ? "proposal-message-error" : undefined}
            />
            {errors.message ? (
              <em id="proposal-message-error" className={styles.error}>
                {errors.message}
              </em>
            ) : null}
          </label>
          <button type="submit" className={styles.submit}>
            Gửi đề xuất
          </button>
        </form>
      </div>
    </main>
  );
}
