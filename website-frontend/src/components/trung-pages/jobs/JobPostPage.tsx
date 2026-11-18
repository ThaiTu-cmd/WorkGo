"use client";

// Chế độ Thử Nghiệm Sàn Việc Làm
// Đăng việc làm mới - Create Job with DTO & Input Checklist
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import { FilePlus2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { jobApi, catalogApi, useAuthToken } from "../../webapp-bridge/backend";
import { JOB_TYPES, type JobType } from "./types";
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

type Tr = (key: string, values?: Record<string, string | number>) => string;

export function validateJobTitle(raw: string, tr: Tr): string | undefined {
  const clean = sanitizeText(raw);
  if (clean.length < TITLE_MIN) return tr("m1667", { p0: TITLE_MIN, p1: TITLE_MAX });
  if (clean.length > TITLE_MAX) return tr("m1668", { p0: clean.length, p1: TITLE_MAX });
  return undefined;
}

export function validateJobDescription(raw: string, tr: Tr): string | undefined {
  const clean = sanitizeText(raw);
  return clean.length < DESC_MIN ? tr("m1669", { p0: DESC_MIN }) : undefined;
}

export function validateJobBudget(raw: string, tr: Tr): string | undefined {
  const budget = Number(String(raw).replace(/[^\d]/g, ""));
  if (!Number.isFinite(budget) || budget <= 0) return tr("m1670");
  if (budget < PRICE_MIN) return tr("m1671", { p0: PRICE_MIN.toLocaleString("vi-VN") });
  if (budget > PRICE_MAX) return tr("m1672", { p0: PRICE_MAX.toLocaleString("vi-VN") });
  return undefined;
}

interface CategoryOption {
  categoryId: string;
  name: string;
}

export default function JobPostPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMinRaw, setBudgetMinRaw] = useState("");
  const [budgetMaxRaw, setBudgetMaxRaw] = useState("");
  const [type, setType] = useState<JobType>("DIGITAL");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minDateStr, setMinDateStr] = useState("");
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    budget?: string;
    category?: string;
    location?: string;
    deadline?: string;
    form?: string;
  }>({});

  // Initialize minDateStr asynchronously on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setMinDateStr(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    let cancelled = false;
    catalogApi.getRootCategories().then((res: unknown) => {
      if (cancelled) return;
      const r = res as { result?: unknown[] } | unknown[];
      const list = (r && typeof r === "object" && "result" in r ? r.result : r) as Array<{
        categoryId: string;
        name: string;
      }>;
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list.map(c => ({ categoryId: c.categoryId, name: c.name })));
        setCategoryId(list[0].categoryId);
      }
    }).catch(() => {
      // Non-blocking fallback
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real-time Checklist state
  const checklist = useMemo(() => {
    const cleanTitle = sanitizeText(title);
    const cleanDesc = sanitizeText(description);
    const minBudget = Number(String(budgetMinRaw).replace(/[^\d]/g, ""));
    const maxBudget = budgetMaxRaw ? Number(String(budgetMaxRaw).replace(/[^\d]/g, "")) : minBudget;
    const isTitleValid = cleanTitle.length >= TITLE_MIN && cleanTitle.length <= TITLE_MAX;
    const isDescValid = cleanDesc.length >= DESC_MIN;
    const isBudgetValid = Number.isFinite(minBudget) && minBudget >= PRICE_MIN && minBudget <= PRICE_MAX &&
      (!budgetMaxRaw || (Number.isFinite(maxBudget) && maxBudget >= minBudget && maxBudget <= PRICE_MAX));
    const isCategoryValid = Boolean(categoryId);
    const isLocationValid = !(type === "ONSITE" || type === "DELIVERY") || sanitizeText(location).length >= 5;
    const isDeadlineValid = !deadline || !minDateStr || deadline >= minDateStr;

    return {
      title: isTitleValid,
      titleLength: cleanTitle.length,
      desc: isDescValid,
      descLength: cleanDesc.length,
      budget: isBudgetValid,
      category: isCategoryValid,
      location: isLocationValid,
      deadline: isDeadlineValid,
      allValid: isTitleValid && isDescValid && isBudgetValid && isCategoryValid && isLocationValid && isDeadlineValid
    };
  }, [title, description, budgetMinRaw, budgetMaxRaw, categoryId, type, location, deadline, minDateStr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minBudgetVal = Number(String(budgetMinRaw).replace(/[^\d]/g, ""));
    const maxBudgetVal = budgetMaxRaw ? Number(String(budgetMaxRaw).replace(/[^\d]/g, "")) : minBudgetVal;

    const next: typeof errors = {
      title: validateJobTitle(title, tr),
      description: validateJobDescription(description, tr),
      budget: validateJobBudget(budgetMinRaw, tr)
    };

    if (budgetMaxRaw && maxBudgetVal < minBudgetVal) {
      next.budget = "Ngân sách tối đa không được nhỏ hơn ngân sách tối thiểu.";
    }

    if (!categoryId) {
      next.category = "Vui lòng chọn danh mục công việc.";
    }

    if ((type === "ONSITE" || type === "DELIVERY") && sanitizeText(location).length < 5) {
      next.location = "Vui lòng nhập địa chỉ / địa điểm thực hiện (tối thiểu 5 ký tự).";
    }

    if (deadline && new Date(deadline).getTime() <= Date.now()) {
      next.deadline = "Hạn chót hoàn thành phải ở trong tương lai.";
    }

    setErrors(next);
    if (next.title || next.description || next.budget || next.category || next.location || next.deadline) {
      return;
    }

    if (!token) {
      onShowToast("Vui lòng đăng nhập để đăng tin việc làm.");
      return;
    }

    setSubmitting(true);
    setErrors(prev => ({ ...prev, form: undefined }));

    try {
      const cleanTitle = sanitizeText(title);
      const cleanDesc = sanitizeText(description);

      await jobApi.createJob({
        title: cleanTitle,
        description: cleanDesc,
        categoryId: categoryId || "00000000-0000-0000-0000-000000000001",
        budgetMin: minBudgetVal,
        budgetMax: maxBudgetVal,
        currency: "VND",
        executionType: type,
        locationSnapshot: (type === "ONSITE" || type === "DELIVERY") ? sanitizeText(location) : undefined,
        deadlineAt: deadline ? new Date(deadline).toISOString() : undefined,
        attachments: []
      });

      onShowToast(tr("m1176"));
      onNavigate("job-list");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || tr("m1140");
      onShowToast(msg);
      setErrors(prev => ({ ...prev, form: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <FilePlus2 size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1182")}
        </h1>
        <p className={styles.sub}>{tr("m1183")}</p>

        {/* Input Checklist Widget */}
        <div className={styles.checklist} aria-label="Danh sách kiểm tra tiêu chuẩn đăng việc">
          <div className={styles.checklistTitle}>
            <AlertCircle size={16} /> Tiêu chuẩn nội dung đăng việc (Input Checklist)
          </div>
          <div className={styles.checklistGrid}>
            <div className={`${styles.checkItem} ${checklist.title ? styles.checkItemValid : styles.checkItemInvalid}`}>
              {checklist.title ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} />}
              <span>Tiêu đề từ 15 đến 100 ký tự (hiện có: {checklist.titleLength}/100)</span>
            </div>
            <div className={`${styles.checkItem} ${checklist.desc ? styles.checkItemValid : styles.checkItemInvalid}`}>
              {checklist.desc ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} />}
              <span>Mô tả công việc chi tiết ít nhất 20 ký tự (hiện có: {checklist.descLength})</span>
            </div>
            <div className={`${styles.checkItem} ${checklist.category ? styles.checkItemValid : styles.checkItemInvalid}`}>
              {checklist.category ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} />}
              <span>Chọn danh mục ngành nghề phù hợp</span>
            </div>
            <div className={`${styles.checkItem} ${checklist.budget ? styles.checkItemValid : styles.checkItemInvalid}`}>
              {checklist.budget ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} />}
              <span>Ngân sách dự kiến hợp lệ (50.000 ₫ - 100.000.000 ₫)</span>
            </div>
            {(type === "ONSITE" || type === "DELIVERY") && (
              <div className={`${styles.checkItem} ${checklist.location ? styles.checkItemValid : styles.checkItemInvalid}`}>
                {checklist.location ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} />}
                <span>Địa điểm thực hiện cho việc {type === "ONSITE" ? "Tại chỗ" : "Giao nhận"}</span>
              </div>
            )}
            {deadline && (
              <div className={`${styles.checkItem} ${checklist.deadline ? styles.checkItemValid : styles.checkItemInvalid}`}>
                {checklist.deadline ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} />}
                <span>Thời hạn hoàn thành trong tương lai</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1184")} *</span>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors(prev => ({
                    ...prev,
                    title: validateJobTitle(e.target.value, tr)
                  }));
                }
              }}
              onBlur={() =>
                setErrors(prev => ({
                  ...prev,
                  title: validateJobTitle(title, tr)
                }))
              }
              placeholder={tr("m1177")}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "jobpost-title-error" : undefined}
            />
            {errors.title && (
              <em id="jobpost-title-error" className={styles.error}>
                {errors.title}
              </em>
            )}
          </label>

          <label className={styles.field}>
            <span>{tr("m1185")} *</span>
            <textarea
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors(prev => ({
                    ...prev,
                    description: validateJobDescription(e.target.value, tr)
                  }));
                }
              }}
              onBlur={() =>
                setErrors(prev => ({
                  ...prev,
                  description: validateJobDescription(description, tr)
                }))
              }
              placeholder={tr("m1178")}
              rows={5}
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? "jobpost-description-error" : undefined}
            />
            {errors.description && (
              <em id="jobpost-description-error" className={styles.error}>
                {errors.description}
              </em>
            )}
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Danh mục ngành nghề *</span>
              <select
                value={categoryId}
                onChange={e => {
                  setCategoryId(e.target.value);
                  setErrors(prev => ({ ...prev, category: undefined }));
                }}
              >
                {categories.length === 0 ? (
                  <option value="">Đang tải danh mục...</option>
                ) : (
                  categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
              {errors.category && (
                <em className={styles.error}>{errors.category}</em>
              )}
            </label>

            <label className={styles.field}>
              <span>{tr("m1187")}</span>
              <select value={type} onChange={e => setType(e.target.value as JobType)}>
                {JOB_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>{tr("m1186")} (tối thiểu) *</span>
              <input
                type="text"
                value={budgetMinRaw}
                onChange={e => {
                  setBudgetMinRaw(e.target.value);
                  if (errors.budget) {
                    setErrors(prev => ({
                      ...prev,
                      budget: validateJobBudget(e.target.value, tr)
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    budget: validateJobBudget(budgetMinRaw, tr)
                  }))
                }
                placeholder="2500000"
                inputMode="numeric"
                aria-invalid={errors.budget ? true : undefined}
                aria-describedby={errors.budget ? "jobpost-budget-error" : undefined}
              />
            </label>

            <label className={styles.field}>
              <span>Ngân sách tối đa (tùy chọn)</span>
              <input
                type="text"
                value={budgetMaxRaw}
                onChange={e => setBudgetMaxRaw(e.target.value)}
                placeholder="Để trống nếu bằng tối thiểu"
                inputMode="numeric"
              />
            </label>
          </div>
          {errors.budget && (
            <em id="jobpost-budget-error" className={styles.error} style={{ marginTop: "-8px" }}>
              {errors.budget}
            </em>
          )}

          {(type === "ONSITE" || type === "DELIVERY") && (
            <label className={styles.field}>
              <span>Địa điểm thực hiện ({type === "ONSITE" ? "Tại nhà / cơ sở" : "Địa chỉ giao nhận"}) *</span>
              <input
                type="text"
                value={location}
                onChange={e => {
                  setLocation(e.target.value);
                  setErrors(prev => ({ ...prev, location: undefined }));
                }}
                placeholder="Nhập địa chỉ cụ thể (Quận/Huyện, Tỉnh/TP)..."
              />
              {errors.location && (
                <em className={styles.error}>{errors.location}</em>
              )}
            </label>
          )}

          <label className={styles.field}>
            <span>Thời hạn hoàn thành mong muốn (tùy chọn)</span>
            <input
              type="date"
              min={minDateStr}
              value={deadline}
              onChange={e => {
                setDeadline(e.target.value);
                setErrors(prev => ({ ...prev, deadline: undefined }));
              }}
            />
            {errors.deadline && (
              <em className={styles.error}>{errors.deadline}</em>
            )}
          </label>

          {errors.form && (
            <p className={styles.error} style={{ marginTop: "8px" }}>
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={submitting}
          >
            {submitting ? tr("m1143") : tr("m57")}
          </button>
        </form>
      </div>
    </main>
  );
}
