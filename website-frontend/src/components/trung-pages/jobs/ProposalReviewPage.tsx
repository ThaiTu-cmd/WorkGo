"use client";

// Prototype Mode
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { jobApi, useAuthToken } from "../../webapp-bridge/backend";
import { type Job } from "../_mocks/mockJobs";
import { type Proposal } from "../_mocks/mockProposals";
import styles from "./ProposalReviewPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  jobId?: string;
};

export default function ProposalReviewPage({
  onShowToast,
  jobId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);

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
        if (!selectedJobId && apiList.length > 0) {
          setSelectedJobId(apiList[0].jobId);
        }
      }
    }).catch(() => {
      // Backend not running
    });
    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) return undefined;
    let cancelled = false;

    jobApi.getJobProposals(selectedJobId).then((res: { result?: { data?: unknown[] } }) => {
      if (cancelled) return;
      const apiProps = (res?.result?.data || (Array.isArray(res?.result) ? res.result : [])) as Array<{
        proposalId: string;
        jobId: string;
        price?: number;
        estimatedDays?: number;
        message?: string;
        status?: string;
        createdAt?: string;
      }>;
      if (Array.isArray(apiProps)) {
        setProposals(apiProps.map(p => ({
          proposalId: p.proposalId,
          jobId: p.jobId,
          providerName: tr("m1174"),
          bidPrice: Number(p.price || 0),
          durationDays: Number(p.estimatedDays || 1),
          message: p.message || "",
          status: (p.status as "PENDING" | "ACCEPTED" | "REJECTED") || "PENDING",
          createdAt: p.createdAt ? p.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        })));
      } else {
        setProposals([]);
      }
    }).catch(() => {
      if (!cancelled) setProposals([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token, selectedJobId, tr]);

  const list = useMemo(() => {
    const rows = selectedJobId ? proposals.filter(p => p.jobId === selectedJobId) : proposals;
    return [...rows].sort((a, b) => a.bidPrice - b.bidPrice);
  }, [proposals, selectedJobId]);

  const hasAccepted = useMemo(
    () => (selectedJobId ? proposals.some(p => p.jobId === selectedJobId && p.status === "ACCEPTED") : false),
    [proposals, selectedJobId]
  );

  const accept = async (id: string) => {
    if (!token) {
      onShowToast("Vui lòng đăng nhập để thao tác");
      return;
    }
    try {
      await jobApi.acceptProposal(id);
      setProposals(prev =>
        prev.map(p => (p.proposalId === id ? { ...p, status: "ACCEPTED" } : p.jobId === selectedJobId ? { ...p, status: "REJECTED" } : p))
      );
      onShowToast(tr("m1227"));
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || tr("m1140"));
    }
  };

  const reject = async (id: string) => {
    if (!token) {
      onShowToast("Vui lòng đăng nhập để thao tác");
      return;
    }
    try {
      await jobApi.rejectProposal(id);
      setProposals(prev =>
        prev.map(p => (p.proposalId === id ? { ...p, status: "REJECTED" } : p))
      );
      onShowToast(tr("m1228"));
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || tr("m1140"));
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{tr("m1224")}</h1>
          <p className={styles.sub}>{tr("m1234")}</p>
        </div>
        <select
          value={selectedJobId}
          onChange={e => setSelectedJobId(e.target.value)}
          aria-label={tr("m1232")}
          className={styles.jobSelect}
        >
          {jobs.length === 0 ? (
            <option value="">{tr("m1217")}</option>
          ) : (
            jobs.map(j => (
              <option key={j.jobId} value={j.jobId}>
                {j.title}
              </option>
            ))
          )}
        </select>
      </div>

      {loading ? (
        <p className={styles.empty}>{tr("m1161")}</p>
      ) : list.length === 0 ? (
        <p className={styles.empty}>{tr("m1235")}</p>
      ) : (
        <ul className={styles.list}>
          {list.map(p => (
            <li key={p.proposalId} className={styles.card}>
              <div className={styles.row}>
                <div>
                  <strong className={styles.provider}>{p.providerName}</strong>
                  <span className={styles.time}>{p.createdAt}</span>
                </div>
                <span className={`${styles.badge} ${styles[p.status.toLowerCase()]}`}>
                  {p.status === "PENDING"
                    ? tr("m1237")
                    : p.status === "ACCEPTED"
                    ? tr("m1238")
                    : tr("m1239")}
                </span>
              </div>
              <p className={styles.msg}>{p.message}</p>
              <div className={styles.meta}>
                <span className={styles.price}>
                  {p.bidPrice.toLocaleString("vi-VN")} ₫
                </span>
                <span className={styles.duration}>
                  {tr("m1236", { p0: p.durationDays })}
                </span>
              </div>
              {p.status === "PENDING" && !hasAccepted ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.accept}
                    onClick={() => accept(p.proposalId)}
                  >
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {tr("m1240")}
                  </button>
                  <button
                    type="button"
                    className={styles.reject}
                    onClick={() => reject(p.proposalId)}
                  >
                    <XCircle size={16} aria-hidden="true" />
                    {tr("m1241")}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
