"use client";

// Prototype Mode
// Đánh Giá & Duyệt Đề Xuất - Proposal Review with Lock & Order Creation Sync
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { CheckCircle2, XCircle, RefreshCw, ShoppingCart, Loader2, FileText } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { jobApi, useAuthToken } from "../../webapp-bridge/backend";
import { type JobSummary, type ProposalItem, type OrderSyncStatus } from "./types";
import styles from "./ProposalReviewPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  jobId?: string;
};

export default function ProposalReviewPage(props:TrungPageProps){const token=useAuthToken();return <ProposalReviewContent key={token??'guest'} {...props}/>;}
function ProposalReviewContent({
  onNavigate,
  onShowToast,
  jobId
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Concurrency & action locks
  const [rewardQuotes,setRewardQuotes]=useState<Record<string,{reference:string;points:number;expiresAt:string;remainingPairCap:number;remainingProviderCap:number}>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Order sync states for accepted proposal: { [proposalId]: { status, orderId } }
  const [syncStates, setSyncStates] = useState<Record<string, { status: OrderSyncStatus; orderId?: string }>>({});
  const pollingTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Clean up polling timers on unmount
  useEffect(() => {
    const timers = pollingTimersRef.current;
    return () => {
      Object.values(timers).forEach(t => clearTimeout(t));
    };
  }, []);

  // Order sync status polling
  const syncRef = useRef<(proposalId: string, attempt?: number) => void>(() => {});

  const checkOrderSync = useCallback(async (proposalId: string, attempt = 1) => {
    try {
      const res = await jobApi.orderSync(proposalId);
      const r = (res as { result?: { orderSyncStatus?: OrderSyncStatus; status?: OrderSyncStatus; orderId?: string } })?.result;
      const status: OrderSyncStatus = r?.orderSyncStatus || r?.status || "PENDING";
      const orderId = r?.orderId;

      setSyncStates(prev => ({
        ...prev,
        [proposalId]: { status, orderId }
      }));

      // If pending and attempts < 6, poll again after 2 seconds
      if (status === "PENDING" && attempt < 6) {
        if (pollingTimersRef.current[proposalId]) {
          clearTimeout(pollingTimersRef.current[proposalId]);
        }
        pollingTimersRef.current[proposalId] = setTimeout(() => {
          syncRef.current(proposalId, attempt + 1);
        }, 2000);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    syncRef.current = checkOrderSync;
  }, [checkOrderSync]);

  // 1. Fetch Client's Jobs (prioritize getMyJobs if logged in, fallback to searchJobs)
  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      try {
        let jobList: JobSummary[] = [];

        if (token) {
          try {
            const myRes = await jobApi.getMyJobs({ page: 0, size: 50 });
            const pageData = (myRes as { result?: { data?: unknown[] } })?.result?.data;
            if (Array.isArray(pageData) && pageData.length > 0) {
              jobList = pageData.map(j => {
                const item = j as Record<string, unknown>;
                return {
                  jobId: String(item.jobId),
                  title: String(item.title ?? "Công việc"),
                  description: String(item.description ?? ""),
                  budgetMin: Number(item.budgetMin ?? 0),
                  budgetMax: Number(item.budgetMax ?? 0),
                  currency: String(item.currency ?? "VND"),
                  executionType: (item.executionType as JobSummary["executionType"]) || "DIGITAL",
                  status: String(item.status ?? "OPEN"),
                  applicationCount: Number(item.applicationCount ?? 0),
                  createdAt: String(item.createdAt ?? "").slice(0, 10)
                };
              });
            }
          } catch {
            // Non-client or error, fall through to public search
          }
        }

        if (jobList.length === 0) {
          const publicRes = await jobApi.searchJobs({ page: 0, size: 50 });
          const publicData = (publicRes as { result?: { data?: unknown[] } })?.result?.data;
          if (Array.isArray(publicData)) {
            jobList = publicData.map(j => {
              const item = j as Record<string, unknown>;
              return {
                jobId: String(item.jobId),
                title: String(item.title ?? "Công việc"),
                description: String(item.description ?? ""),
                budgetMin: Number(item.budgetMin ?? 0),
                budgetMax: Number(item.budgetMax ?? 0),
                currency: String(item.currency ?? "VND"),
                executionType: (item.executionType as JobSummary["executionType"]) || "DIGITAL",
                status: String(item.status ?? "OPEN"),
                applicationCount: Number(item.applicationCount ?? 0),
                createdAt: String(item.createdAt ?? "").slice(0, 10)
              };
            });
          }
        }

        if (!cancelled) {
          setJobs(jobList);
          if (!selectedJobId && jobList.length > 0) {
            setSelectedJobId(jobList[0].jobId);
          }
        }
      } catch {
        if (!cancelled) setJobs([]);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [token, selectedJobId]);

  // 2. Fetch Proposals for Selected Job
  useEffect(() => {
    if (!selectedJobId) {
      return;
    }
    let cancelled = false;

    const fetchProposals = async () => {
      try {
        const res = await jobApi.getJobProposals(selectedJobId, { page: 0, size: 50 });
        if (cancelled) return;
        const apiData = (res as { result?: { data?: unknown[] } | unknown[] })?.result;
        const rawList = (apiData && typeof apiData === "object" && "data" in apiData
          ? (apiData as { data?: unknown[] }).data
          : apiData ?? (Array.isArray(res) ? res : [])) as Array<{
          proposalId: string;
          jobId: string;
          price?: number;
          currency?: string;
          estimatedDays?: number;
          message?: string;
          terms?: string;
          status?: string;
          createdAt?: string;
          expiresAt?: string;
          provider?: {
            businessName?: string;
            providerProfileId?: string;
            ratingAvg?: number;
            ratingCount?: number;
          };
        }>;

        if (Array.isArray(rawList)) {
          const mapped: ProposalItem[] = rawList.map(p => ({
            proposalId: p.proposalId,
            jobId: p.jobId,
            providerId: p.provider?.providerProfileId,
            providerName: p.provider?.businessName || tr("m1174"),
            price: Number(p.price || 0),
            currency: p.currency || "VND",
            estimatedDays: Number(p.estimatedDays || 1),
            message: p.message || "",
            terms: p.terms || undefined,
            status: (p.status as ProposalItem["status"]) || "PENDING",
            createdAt: p.createdAt ? p.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : undefined
          }));

          setProposals(mapped);

          // Check if there is already an accepted proposal, initiate order sync check
          const accepted = mapped.find(p => p.status === "ACCEPTED");
          if (accepted) {
            checkOrderSync(accepted.proposalId);
          }
        } else {
          setProposals([]);
        }
      } catch {
        if (!cancelled) setProposals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProposals();

    return () => {
      cancelled = true;
    };
  }, [selectedJobId, tr, checkOrderSync]);

  // Filter & sort proposals
  const list = useMemo(() => {
    return proposals.filter(p => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => a.price - b.price);
  }, [proposals, statusFilter]);

  const hasAccepted = useMemo(
    () => proposals.some(p => p.status === "ACCEPTED"),
    [proposals]
  );

  // Accept Proposal
  const accept = async (id: string) => {
    if (!token) {
      onShowToast("Vui lòng đăng nhập để thao tác.");
      return;
    }

    if (processingId) return; // Concurrency lock
    setProcessingId(id);

    try {
      const q=rewardQuotes[id];
      if(!q||Date.parse(q.expiresAt)<=Date.now()){
        const receipt=await jobApi.getProposalRewardQuote(id);const next=receipt?.result;
        if(!next?.reference||!Number.isInteger(next.points))throw new Error('Invalid reward quote receipt');
        setRewardQuotes(old=>({...old,[id]:next}));return;
      }
      const res = await jobApi.acceptProposal(id);
      const resResult = (res as { result?: { orderSyncStatus?: OrderSyncStatus; status?: OrderSyncStatus; orderId?: string } })?.result;
      const initialStatus: OrderSyncStatus = resResult?.orderSyncStatus || resResult?.status || "PENDING";
      const initialOrderId = resResult?.orderId;

      // Update proposal statuses locally
      setProposals(prev =>
        prev.map(p => (
          p.proposalId === id
            ? { ...p, status: "ACCEPTED" }
            : p.status === "PENDING"
            ? { ...p, status: "REJECTED" }
            : p
        ))
      );

      setSyncStates(prev => ({
        ...prev,
        [id]: { status: initialStatus, orderId: initialOrderId }
      }));

      onShowToast(tr("m1227"));

      // Poll sync status to see when Order is created in outbox
      checkOrderSync(id);
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || tr("m1140"));
    } finally {
      setProcessingId(null);
    }
  };

  // Reject Proposal
  const reject = async (id: string) => {
    if (!token) {
      onShowToast("Vui lòng đăng nhập để thao tác.");
      return;
    }

    if (processingId) return; // Concurrency lock
    setProcessingId(id);

    try {
      await jobApi.rejectProposal(id);
      setProposals(prev =>
        prev.map(p => (p.proposalId === id ? { ...p, status: "REJECTED" } : p))
      );
      onShowToast(tr("m1228"));
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || tr("m1140"));
    } finally {
      setProcessingId(null);
    }
  };

  // Retry Order Creation if outbox failed
  const retryOrder = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await jobApi.retryOrder(proposalId);
      onShowToast("Đã gửi yêu cầu thử lại tạo đơn hàng.");
      checkOrderSync(proposalId);
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || "Không thể thử lại tạo đơn hàng.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{tr("m1224")}</h1>
          <p className={styles.sub}>{tr("m1234")}</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            aria-label={tr("m1232")}
            className={styles.jobSelect}
            style={{
              minHeight: "44px",
              border: "1px solid var(--wg-border)",
              borderRadius: "10px",
              padding: "8px 12px",
              background: "var(--wg-surface)",
              fontWeight: 600,
              fontSize: "0.95rem"
            }}
          >
            {jobs.length === 0 ? (
              <option value="">{tr("m1217")}</option>
            ) : (
              jobs.map(j => (
                <option key={j.jobId} value={j.jobId}>
                  {j.title} ({j.applicationCount} báo giá)
                </option>
              ))
            )}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái đề xuất"
            style={{
              minHeight: "44px",
              border: "1px solid var(--wg-border)",
              borderRadius: "10px",
              padding: "8px 12px",
              background: "var(--wg-surface)",
              fontSize: "0.92rem"
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ duyệt</option>
            <option value="ACCEPTED">Đã chấp nhận</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="spin" style={{ animation: "spin 1s linear infinite", color: "var(--wg-primary)" }} />
          <p className={styles.empty}>{tr("m1161")}</p>
        </div>
      ) : list.length === 0 ? (
        <p className={styles.empty}>{tr("m1235")}</p>
      ) : (
        <ul className={styles.list}>
          {list.map(p => {
            const sync = syncStates[p.proposalId];
            const isRowLocked = processingId === p.proposalId;

            return (
              <li key={p.proposalId} className={styles.item}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div>
                    <strong className={styles.provider}>{p.providerName}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--wg-text-muted)" }}>
                      Gửi lúc: {p.createdAt}
                      {p.expiresAt && ` • Hết hạn: ${p.expiresAt}`}
                    </div>
                  </div>
                  <span
                    className={styles.status}
                    data-status={p.status}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background:
                        p.status === "ACCEPTED"
                          ? "#dcfce7"
                          : p.status === "REJECTED"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        p.status === "ACCEPTED"
                          ? "#166534"
                          : p.status === "REJECTED"
                          ? "#991b1b"
                          : "#92400e"
                    }}
                  >
                    {p.status === "PENDING"
                      ? tr("m1237")
                      : p.status === "ACCEPTED"
                      ? tr("m1238")
                      : p.status === "REJECTED"
                      ? tr("m1239")
                      : p.status}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "baseline", marginTop: "4px" }}>
                  <span className={styles.bid}>{p.price.toLocaleString("vi-VN")} ₫</span>
                  <span style={{ fontSize: "0.88rem", color: "var(--wg-text-secondary)" }}>
                    {tr("m1236", { p0: p.estimatedDays })}
                  </span>
                </div>

                <p className={styles.msg}>{p.message}</p>

                {p.terms && (
                  <div className={styles.termsBox}>
                    <FileText size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                    <strong>Cam kết:</strong> {p.terms}
                  </div>
                )}

                {/* Order Outbox Sync Status Banner when proposal is accepted */}
                {p.status === "ACCEPTED" && (
                  <div
                    className={`${styles.syncBanner} ${
                      sync?.status === "SUCCESS"
                        ? styles.syncSuccess
                        : sync?.status === "FAILED"
                        ? styles.syncFailed
                        : styles.syncPending
                    }`}
                  >
                    {sync?.status === "SUCCESS" ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={18} />
                          <span>Đã tạo đơn hàng thành công! {sync.orderId ? `Mã: ${sync.orderId.slice(0, 8)}...` : ""}</span>
                        </div>
                        {sync.orderId && (
                          <button
                            type="button"
                            className={styles.syncAction}
                            style={{ background: "#166534", color: "#ffffff" }}
                            onClick={() => onNavigate("order-payment", { orderId: sync.orderId })}
                          >
                            <ShoppingCart size={14} style={{ display: "inline", marginRight: "4px" }} />
                            Xem đơn hàng
                          </button>
                        )}
                      </>
                    ) : sync?.status === "FAILED" ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <XCircle size={18} />
                          <span>Đồng bộ tạo đơn hàng chưa thành công.</span>
                        </div>
                        <button
                          type="button"
                          className={styles.syncAction}
                          style={{ background: "#dc2626", color: "#ffffff" }}
                          disabled={isRowLocked}
                          onClick={() => retryOrder(p.proposalId)}
                        >
                          <RefreshCw size={14} style={{ display: "inline", marginRight: "4px" }} />
                          Thử lại tạo đơn
                        </button>
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                        <span>Hệ thống đang đồng bộ tạo đơn hàng (Order Outbox)...</span>
                      </div>
                    )}
                  </div>
                )}

                {rewardQuotes[p.proposalId]&&<p role="status">Thưởng dự kiến {rewardQuotes[p.proposalId].points} điểm · Cap còn lại cặp {rewardQuotes[p.proposalId].remainingPairCap}, Provider {rewardQuotes[p.proposalId].remainingProviderCap}. Chỉ grant khi đủ điều kiện hoàn tất.</p>}
                {/* Accept & Reject Action buttons (with concurrency lock) */}
                {p.status === "PENDING" && !hasAccepted && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primary}
                      disabled={Boolean(processingId)}
                      onClick={() => accept(p.proposalId)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {isRowLocked ? (
                        <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <CheckCircle2 size={16} aria-hidden="true" />
                      )}
                      {rewardQuotes[p.proposalId]?tr("m1240"):"Xem quote trước khi chấp nhận"}
                    </button>
                    <button
                      type="button"
                      className={styles.ghost}
                      disabled={Boolean(processingId)}
                      onClick={() => reject(p.proposalId)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <XCircle size={16} aria-hidden="true" />
                      {tr("m1241")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
