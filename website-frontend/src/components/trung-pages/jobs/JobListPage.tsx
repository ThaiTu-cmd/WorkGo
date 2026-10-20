"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { JOB_TYPES, mockJobs, type Job, type JobType } from "../_mocks/mockJobs";
import { KEYS } from "../_stores/keys";
import styles from "./JobListPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

const PAGE_SIZE = 6;

function loadJobs(): Job[] {
  if (typeof window === "undefined") return mockJobs;
  try {
    const raw = window.localStorage.getItem(KEYS.jobs);
    if (!raw) return mockJobs;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Job[]) : mockJobs;
  } catch {
    return mockJobs;
  }
}

export function formatBudget(v: number): string {
  return `${v.toLocaleString("vi-VN")} ₫`;
}

export default function JobListPage({ onNavigate }: TrungPageProps) {
  const [jobs] = useState<Job[]>(() => loadJobs());
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typeFilter, setTypeFilter] = useState<JobType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (typeFilter !== "ALL" && j.type !== typeFilter) return false;
      if (debounced === "") return true;
      return (
        j.title.toLowerCase().includes(debounced) || j.description.toLowerCase().includes(debounced)
      );
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
            <BriefcaseBusiness size={24} className={styles.titleIcon} aria-hidden="true" /> Tìm việc làm
          </h1>
          <p className={styles.sub}>Khám phá các việc client đăng cần provider thực hiện.</p>
        </div>
        <button type="button" className={styles.primary} onClick={() => onNavigate("job-post")}>
          Đăng việc mới
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tiêu đề hoặc mô tả..."
          aria-label="Tìm việc làm"
          className={styles.search}
        />
        <div className={styles.chips} role="group" aria-label="Lọc theo loại việc">
          {(["ALL", ...JOB_TYPES] as const).map((t) => (
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
              {t === "ALL" ? "Tất cả" : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.grid} aria-busy="true" aria-label="Đang tải danh sách việc">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <p className={styles.empty}>Không tìm thấy việc nào phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.</p>
      ) : (
        <>
          <ul className={styles.grid}>
            {pageItems.map((j) => (
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
                  Gửi đề xuất
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
              Trước
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
