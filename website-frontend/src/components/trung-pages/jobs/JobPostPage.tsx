"use client";

// Chế độ Thử Nghiệm Sàn Việc Làm
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FilePlus2 } from "lucide-react";
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
  return sanitizeText(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}
export function validateJobTitle(raw: string): string | undefined {
  const clean = sanitizeText(raw);
  if (clean.length < TITLE_MIN) return `Please enter a title between ${TITLE_MIN} and ${TITLE_MAX} characters!`;
  if (clean.length > TITLE_MAX) return `Title is too long (${clean.length}/${TITLE_MAX} characters) — please shorten it!`;
  return undefined;
}
export function validateJobDescription(raw: string): string | undefined {
  const clean = sanitizeText(raw);
  return clean.length < DESC_MIN ? `Please enter a detailed description of ${DESC_MIN} characters or more!` : undefined;
}
export function validateJobBudget(raw: string): string | undefined {
  const budget = Number(String(raw).replace(/[^\d]/g, ""));
  if (!Number.isFinite(budget) || budget <= 0) return "Package price must be a number greater than 0!";
  if (budget < PRICE_MIN) return `Minimum price is ${PRICE_MIN.toLocaleString("vi-VN")} ₫!`;
  if (budget > PRICE_MAX) return `Price exceeds ${PRICE_MAX.toLocaleString("vi-VN")} ₫ allowed!`;
  return undefined;
}
export default function JobPostPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetRaw, setBudgetRaw] = useState("");
  const [type, setType] = useState<JobType>("DIGITAL");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    budget?: string;
  }>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      title: validateJobTitle(title),
      description: validateJobDescription(description),
      budget: validateJobBudget(budgetRaw)
    };
    setErrors(next);
    if (next.title ?? next.description ?? next.budget) return;
    const cleanTitle = sanitizeText(title);
    const cleanDesc = sanitizeText(description);
    const budget = Number(String(budgetRaw).replace(/[^\d]/g, ""));
    const job: Job = {
      jobId: `job-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      budget,
      type,
      clientName: tr("m1174"),
      createdAt: new Date().toISOString().slice(0, 10)
    };
    void slugify(cleanTitle);
    try {
      const raw = window.localStorage.getItem(KEYS.jobs);
      const list = raw ? JSON.parse(raw) as Job[] : mockJobs;
      window.localStorage.setItem(KEYS.jobs, JSON.stringify([job, ...(Array.isArray(list) ? list : mockJobs)]));
    } catch {
      onShowToast(tr("m1175"));
      return;
    }
    onShowToast(tr("m1176"));
    onNavigate("job-list");
  };
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <FilePlus2 size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1182")}</h1>
        <div style={{
        padding: "10px 14px",
        backgroundColor: "#fef3c7",
        border: "1px solid #fde68a",
        borderRadius: "8px",
        color: "#92400e",
        fontSize: "0.85rem",
        marginBottom: "16px",
        fontWeight: 500
      }}>{tr("m1164")}</div>
        <p className={styles.sub}>{tr("m1183")}</p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1184")}</span>
            <input type="text" autoFocus value={title} onChange={e => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({
              ...prev,
              title: validateJobTitle(e.target.value)
            }));
          }} onBlur={() => setErrors(prev => ({
            ...prev,
            title: validateJobTitle(title)
          }))} placeholder={tr("m1177")} aria-invalid={errors.title ? true : undefined} aria-describedby={errors.title ? "jobpost-title-error" : undefined} />
            {errors.title ? <em id="jobpost-title-error" className={styles.error}>
                {errors.title}
              </em> : null}
          </label>
          <label className={styles.field}>
            <span>{tr("m1185")}</span>
            <textarea value={description} onChange={e => {
            setDescription(e.target.value);
            if (errors.description) setErrors(prev => ({
              ...prev,
              description: validateJobDescription(e.target.value)
            }));
          }} onBlur={() => setErrors(prev => ({
            ...prev,
            description: validateJobDescription(description)
          }))} placeholder={tr("m1178")} rows={5} aria-invalid={errors.description ? true : undefined} aria-describedby={errors.description ? "jobpost-description-error" : undefined} />
            {errors.description ? <em id="jobpost-description-error" className={styles.error}>
                {errors.description}
              </em> : null}
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>{tr("m1186")}</span>
              <input type="text" value={budgetRaw} onChange={e => {
              setBudgetRaw(e.target.value);
              if (errors.budget) setErrors(prev => ({
                ...prev,
                budget: validateJobBudget(e.target.value)
              }));
            }} onBlur={() => setErrors(prev => ({
              ...prev,
              budget: validateJobBudget(budgetRaw)
            }))} placeholder="2500000" inputMode="numeric" aria-invalid={errors.budget ? true : undefined} aria-describedby={errors.budget ? "jobpost-budget-error" : undefined} />
              {errors.budget ? <em id="jobpost-budget-error" className={styles.error}>
                  {errors.budget}
                </em> : null}
            </label>
            <label className={styles.field}>
              <span>{tr("m1187")}</span>
              <select value={type} onChange={e => setType(e.target.value as JobType)}>
                {JOB_TYPES.map(t => <option key={t} value={t}>
                    {t}
                  </option>)}
              </select>
            </label>
          </div>
          <button type="submit" className={styles.submit}>{tr("m57")}</button>
        </form>
      </div>
    </main>;
}