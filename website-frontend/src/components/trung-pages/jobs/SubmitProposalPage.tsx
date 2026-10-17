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
    const next: typeof errors = {};
    if (!selectedJobId) next.job = "Vui lòng chọn việc cần gửi đề xuất!";
    const bid = Number(String(bidRaw).replace(/[^\d]/g, ""));
    if (!Number.isFinite(bid) || bid <= 0) next.bid = "Giá gói phải là số lớn hơn 0!";
    else if (bid < PRICE_MIN) next.bid = `Giá tối thiểu là ${PRICE_MIN.toLocaleString("vi-VN")} ₫!`;
    else if (bid > PRICE_MAX) next.bid = `Giá vượt quá ${PRICE_MAX.toLocaleString("vi-VN")} ₫ cho phép!`;
    const duration = Number(durationRaw);
    if (!Number.isInteger(duration) || duration < 1) next.duration = "Thời gian thực hiện tối thiểu 1 ngày!";
    const cleanMsg = sanitizeText(message);
    if (cleanMsg.length < 20) next.message = "Vui lòng nhập lời nhắn chi tiết từ 20 ký tự trở lên!";
    setErrors(next);
    if (next.job ?? next.bid ?? next.duration ?? next.message) return;

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
            <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
              <option value="">-- Chọn việc --</option>
              {jobs.map((j) => (
                <option key={j.jobId} value={j.jobId}>
                  {j.title}
                </option>
              ))}
            </select>
            {errors.job ? <em className={styles.error}>{errors.job}</em> : null}
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Giá chào (₫)</span>
              <input value={bidRaw} onChange={(e) => setBidRaw(e.target.value)} placeholder="2000000" inputMode="numeric" />
              {errors.bid ? <em className={styles.error}>{errors.bid}</em> : null}
            </label>
            <label className={styles.field}>
              <span>Số ngày thực hiện</span>
              <input value={durationRaw} onChange={(e) => setDurationRaw(e.target.value)} placeholder="5" inputMode="numeric" />
              {errors.duration ? <em className={styles.error}>{errors.duration}</em> : null}
            </label>
          </div>
          <label className={styles.field}>
            <span>Lời nhắn (tối thiểu 20 ký tự)</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Kinh nghiệm và phương án thực hiện của bạn..." />
            {errors.message ? <em className={styles.error}>{errors.message}</em> : null}
          </label>
          <button type="submit" className={styles.submit}>
            Gửi đề xuất
          </button>
        </form>
      </div>
    </main>
  );
}
