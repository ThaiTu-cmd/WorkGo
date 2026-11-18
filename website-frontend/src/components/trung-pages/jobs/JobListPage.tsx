"use client";

// Chế độ Thử Nghiệm Sàn Việc Làm
// Sàn Việc Làm - Server-side search, filtering, and pagination
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, AlertCircle, RefreshCw, Eye } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { jobApi, catalogApi } from "../../webapp-bridge/backend";
import { JOB_TYPES, type JobSummary, type JobType } from "./types";
import styles from "./JobListPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

const PAGE_SIZE = 9;

export function formatBudget(min: number, max?: number): string {
  if (!max || max === min) {
    return `${min.toLocaleString("vi-VN")} ₫`;
  }
  return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} ₫`;
}

interface CategoryOption {
  categoryId: string;
  name: string;
}

export default function JobListPage({
  onNavigate
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typeFilter, setTypeFilter] = useState<JobType | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("createdAt,desc");
  const [page, setPage] = useState(0); // 0-indexed for backend API
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
      if (Array.isArray(list)) {
        setCategories(list.map(c => ({ categoryId: c.categoryId, name: c.name })));
      }
    }).catch(() => {
      // Non-blocking
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Server-side search & fetch
  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      try {
        const res = (await jobApi.searchJobs({
          keyword: debounced || undefined,
          executionType: typeFilter !== "ALL" ? typeFilter : undefined,
          categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined,
          page,
          size: PAGE_SIZE,
          sort: sortOrder,
        })) as { result?: { data?: unknown[]; totalPages?: number; totalElements?: number; currentPage?: number } };

        if (cancelled) return;
        const pageResult = res?.result;
        const apiList = (pageResult?.data || (Array.isArray(pageResult) ? pageResult : [])) as Array<{
          jobId: string;
          clientId?: string;
          categoryId?: string;
          title: string;
          description?: string;
          budgetMin?: number;
          budgetMax?: number;
          currency?: string;
          executionType?: string;
          status?: string;
          applicationCount?: number;
          createdAt?: string;
          deadlineAt?: string;
        }>;

        const mapped: JobSummary[] = apiList.map(j => ({
          jobId: j.jobId,
          clientId: j.clientId,
          categoryId: j.categoryId,
          title: j.title,
          description: j.description || "",
          budgetMin: Number(j.budgetMin ?? 100000),
          budgetMax: Number(j.budgetMax ?? j.budgetMin ?? 100000),
          currency: j.currency || "VND",
          executionType: (j.executionType as JobType) || "DIGITAL",
          status: j.status || "OPEN",
          clientName: tr("m1174"),
          applicationCount: Number(j.applicationCount ?? 0),
          createdAt: j.createdAt ? j.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          deadlineAt: j.deadlineAt ? j.deadlineAt.slice(0, 10) : undefined,
        }));

        setJobs(mapped);
        setTotalPages(Math.max(1, Number(pageResult?.totalPages ?? 1)));
        setTotalElements(Number(pageResult?.totalElements ?? mapped.length));
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Không thể kết nối đến máy chủ việc làm (job-service). Vui lòng thử lại sau.");
          setJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [debounced, typeFilter, categoryFilter, page, sortOrder, tr, reloadKey]);

  return (
    <main className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            <BriefcaseBusiness size={24} className={styles.titleIcon} aria-hidden="true" />
            {tr("m1159")}
          </h1>
          <p className={styles.sub}>{tr("m1162")}</p>
        </div>
        <button type="button" className={styles.primary} onClick={() => onNavigate("job-post")}>
          {tr("m1163")}
        </button>
      </div>

      <div
        style={{
          padding: "10px 14px",
          backgroundColor: "#fef3c7",
          border: "1px solid #fde68a",
          borderRadius: "8px",
          color: "#92400e",
          fontSize: "0.85rem",
          marginBottom: "16px",
          fontWeight: 500,
        }}
      >
        {tr("m1164")}
      </div>

      <div className={styles.toolbar}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", width: "100%" }}>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tr("m1158")}
            aria-label={tr("m1159")}
            className={styles.search}
            style={{ flex: "1 1 300px" }}
          />

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              aria-label="Lọc theo danh mục"
              style={{
                minHeight: "44px",
                border: "1px solid var(--wg-border)",
                borderRadius: "10px",
                padding: "8px 12px",
                background: "var(--wg-surface)",
                fontSize: "0.95rem"
              }}
            >
              <option value="ALL">Tất cả ngành nghề</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortOrder}
            onChange={e => {
              setSortOrder(e.target.value);
              setPage(0);
            }}
            aria-label="Sắp xếp"
            style={{
              minHeight: "44px",
              border: "1px solid var(--wg-border)",
              borderRadius: "10px",
              padding: "8px 12px",
              background: "var(--wg-surface)",
              fontSize: "0.95rem"
            }}
          >
            <option value="createdAt,desc">Mới nhất</option>
            <option value="createdAt,asc">Cũ nhất</option>
            <option value="budgetMin,desc">Ngân sách cao nhất</option>
            <option value="budgetMin,asc">Ngân sách thấp nhất</option>
          </select>
        </div>

        <div className={styles.chips} role="group" aria-label={tr("m1160")}>
          {(["ALL", ...JOB_TYPES] as const).map(t => (
            <button
              key={t}
              type="button"
              className={t === typeFilter ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              aria-pressed={t === typeFilter}
              onClick={() => {
                setTypeFilter(t);
                setPage(0);
              }}
            >
              {t === "ALL" ? tr("m142") : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.grid} aria-busy="true" aria-label={tr("m1161")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            backgroundColor: "var(--surface-subtle, #f8fafc)",
            borderRadius: "12px",
            border: "1px solid var(--border-default, #e2e8f0)",
            margin: "20px 0"
          }}
        >
          <AlertCircle size={32} color="#ef4444" style={{ marginBottom: "12px" }} />
          <p style={{ color: "var(--text-primary, #1e293b)", fontWeight: 500, marginBottom: "16px" }}>
            {error}
          </p>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setReloadKey(k => k + 1)}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <p className={styles.empty}>{tr("m1166")}</p>
      ) : (
        <>
          <div style={{ marginTop: "12px", color: "var(--wg-text-secondary)", fontSize: "0.88rem" }}>
            Tìm thấy {totalElements} công việc phù hợp
          </div>

          <ul className={styles.grid}>
            {jobs.map(j => (
              <li key={j.jobId} className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={styles.type}>{j.executionType}</span>
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    background: j.status === "OPEN" ? "#dcfce7" : "#f1f5f9",
                    color: j.status === "OPEN" ? "#166534" : "#64748b"
                  }}>
                    {j.status === "OPEN" ? "Đang nhận đề xuất" : j.status}
                  </span>
                </div>
                <p className={styles.jobTitle}>{j.title}</p>
                <p className={styles.desc}>{j.description}</p>
                <p className={styles.budget}>{formatBudget(j.budgetMin, j.budgetMax)}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "var(--wg-text-muted)" }}>
                  <span>{j.clientName} • {j.createdAt}</span>
                  <span>{j.applicationCount} đề xuất</span>
                </div>
                {j.deadlineAt && (
                  <div style={{ fontSize: "0.78rem", color: "#b45309" }}>
                    Hạn: {j.deadlineAt}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <button
                    type="button"
                    className={styles.ghost}
                    style={{ flex: 1 }}
                    onClick={() => onNavigate("submit-proposal", { jobId: j.jobId })}
                  >
                    {tr("m1167")}
                  </button>
                  <button
                    type="button"
                    className={styles.ghost}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    title="Xem đề xuất công việc"
                    onClick={() => onNavigate("proposal-review", { jobId: j.jobId })}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.pager}>
            <button
              type="button"
              className={styles.ghost}
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              {tr("m426")}
            </button>
            <span className={styles.pageInfo}>
              Trang {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              className={styles.ghost}
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </main>
  );
}
