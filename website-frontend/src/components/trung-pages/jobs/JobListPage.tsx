"use client";

// Chế độ Thử Nghiệm Sàn Việc Làm
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, AlertCircle, RefreshCw } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { jobApi } from "../../webapp-bridge/backend";
import { JOB_TYPES, type Job, type JobType } from "../_mocks/mockJobs";
import styles from "./JobListPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

const PAGE_SIZE = 6;

export function formatBudget(v: number): string {
  return `${v.toLocaleString("vi-VN")} ₫`;
}

export default function JobListPage({
  onNavigate
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typeFilter, setTypeFilter] = useState<JobType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    jobApi.searchJobs({
      keyword: debounced || undefined,
      executionType: typeFilter !== "ALL" ? typeFilter : undefined,
      page: 0,
      size: 50
    }).then((res: { result?: { data?: unknown[] } }) => {
      if (cancelled) return;
      const apiList = (res?.result?.data || (Array.isArray(res?.result) ? res.result : [])) as Array<{
        jobId: string;
        title: string;
        description?: string;
        budgetMin?: number;
        budgetMax?: number;
        executionType?: string;
        applicationCount?: number;
        createdAt?: string;
      }>;
      const mapped: Job[] = apiList.map(j => ({
        jobId: j.jobId,
        title: j.title,
        description: j.description || "",
        budget: Number(j.budgetMin ?? j.budgetMax ?? 100000),
        type: (j.executionType as JobType) || "DIGITAL",
        clientName: tr("m1174"),
        bidsCount: Number(j.applicationCount ?? 0),
        createdAt: j.createdAt ? j.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      }));
      setJobs(mapped);
    }).catch(() => {
      if (!cancelled) {
        setError("Không thể kết nối đến máy chủ việc làm (job-service). Vui lòng thử lại sau.");
        setJobs([]);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [debounced, typeFilter, tr, reloadKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      if (typeFilter !== "ALL" && j.type !== typeFilter) return false;
      if (debounced === "") return true;
      return j.title.toLowerCase().includes(debounced) || j.description.toLowerCase().includes(debounced);
    });
  }, [jobs, debounced, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

      <div className={styles.toolbar}>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tr("m1158")}
          aria-label={tr("m1159")}
          className={styles.search}
        />
        <div className={styles.chips} role="group" aria-label={tr("m1160")}>
          {(["ALL", ...JOB_TYPES] as const).map(t => (
            <button
              key={t}
              type="button"
              className={t === typeFilter ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              aria-pressed={t === typeFilter}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
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
      ) : pageItems.length === 0 ? (
        <p className={styles.empty}>{tr("m1166")}</p>
      ) : (
        <>
          <ul className={styles.grid}>
            {pageItems.map(j => (
              <li key={j.jobId} className={styles.card}>
                <span className={styles.type}>{j.type}</span>
                <p className={styles.jobTitle}>{j.title}</p>
                <p className={styles.desc}>{j.description}</p>
                <p className={styles.budget}>{formatBudget(j.budget)}</p>
                <p className={styles.client}>
                  {j.clientName} • {j.createdAt}
                </p>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => onNavigate("submit-proposal", { jobId: j.jobId })}
                >
                  {tr("m1167")}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.ghost}
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              {tr("m426")}
            </button>
            <span className={styles.pageInfo}>
              Trang {safePage}/{totalPages}
            </span>
            <button
              type="button"
              className={styles.ghost}
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </main>
  );
}
