"use client";

import { useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { JOB_TYPES, mockJobs, type Job, type JobType } from "../_mocks/mockJobs";
import { KEYS } from "../_stores/keys";
import styles from "./JobPostPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export const TITLE_MIN = 15;
export const TITLE_MAX = 100;
export const DESC_MIN = 20;
export const PRICE_MIN = 50000;
export const PRICE_MAX = 100000000;

export function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

export function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

export function slugify(s: string): string {
  return sanitizeText(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export default function JobPostPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetRaw, setBudgetRaw] = useState("");
  const [type, setType] = useState<JobType>("DIGITAL");
  const [errors, setErrors] = useState<{ title?: string; description?: string; budget?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title);
    const cleanDesc = sanitizeText(description);
    const budget = Number(String(budgetRaw).replace(/[^\d]/g, ""));
    const next: typeof errors = {};
    if (cleanTitle.length < TITLE_MIN || cleanTitle.length > TITLE_MAX) {
      next.title =
        cleanTitle.length < TITLE_MIN
          ? `Vui lòng nhập tiêu đề từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự!`
          : `Tiêu đề quá dài (${cleanTitle.length}/${TITLE_MAX} ký tự) — vui lòng rút gọn!`;
    }
    if (cleanDesc.length < DESC_MIN) {
      next.description = `Vui lòng nhập mô tả chi tiết từ ${DESC_MIN} ký tự trở lên!`;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
      next.budget = "Giá gói phải là số lớn hơn 0!";
    } else if (budget < PRICE_MIN) {
      next.budget = `Giá tối thiểu là ${PRICE_MIN.toLocaleString("vi-VN")} ₫!`;
    } else if (budget > PRICE_MAX) {
      next.budget = `Giá vượt quá ${PRICE_MAX.toLocaleString("vi-VN")} ₫ cho phép!`;
    }
    setErrors(next);
    if (next.title ?? next.description ?? next.budget) return;

    const job: Job = {
      jobId: `job-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      budget,
      type,
      clientName: "Bạn",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    void slugify(cleanTitle);
    try {
      const raw = window.localStorage.getItem(KEYS.jobs);
      const list = raw ? (JSON.parse(raw) as Job[]) : mockJobs;
      window.localStorage.setItem(KEYS.jobs, JSON.stringify([job, ...(Array.isArray(list) ? list : mockJobs)]));
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast("Đã đăng việc làm mới!");
    onNavigate("job-list");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Đăng việc làm</h1>
        <p className={styles.sub}>Mô tả việc cần làm, provider sẽ gửi đề xuất cho bạn.</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Tiêu đề (15-100 ký tự)</span>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thiết kế logo quán cà phê sân vườn"
              aria-invalid={errors.title ? true : undefined}
            />
            {errors.title ? <em className={styles.error}>{errors.title}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Mô tả chi tiết (tối thiểu 20 ký tự)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi, yêu cầu và thời gian mong muốn..."
              rows={5}
              aria-invalid={errors.description ? true : undefined}
            />
            {errors.description ? <em className={styles.error}>{errors.description}</em> : null}
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Ngân sách (₫)</span>
              <input
                type="text"
                value={budgetRaw}
                onChange={(e) => setBudgetRaw(e.target.value)}
                placeholder="2500000"
                inputMode="numeric"
                aria-invalid={errors.budget ? true : undefined}
              />
              {errors.budget ? <em className={styles.error}>{errors.budget}</em> : null}
            </label>
            <label className={styles.field}>
              <span>Loại việc</span>
              <select value={type} onChange={(e) => setType(e.target.value as JobType)}>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className={styles.submit}>
            Đăng việc
          </button>
        </form>
      </div>
    </main>
  );
}
