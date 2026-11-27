"use client";

// Prototype Mode
// Gửi Đề Xuất Việc Làm - Submit Proposal with Wallet & Sanction Guards
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Send, AlertTriangle, ShieldAlert, ArrowRight, Briefcase } from "lucide-react";
import type { CatalogFilterParams, PageKey } from "../../shell/MarketplaceShell";
import { jobApi, paymentApi, providerApi, useAuthToken } from "../../shell/backend";
import { type JobSummary, type JobDetail } from "./types";
import styles from "./SubmitProposalPage.module.css";

export type PageProps = {
  onNavigate: (page: PageKey, params?: CatalogFilterParams) => void;
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

type Tr = (key: string, values?: Record<string, string | number>) => string;

export function validateProposalJob(raw: string, tr: Tr): string | undefined {
  return raw ? undefined : tr("m1673");
}

export function validateProposalBid(raw: string, tr: Tr): string | undefined {
  const bid = Number(String(raw).replace(/[^\d]/g, ""));
  if (!Number.isFinite(bid) || bid <= 0) return tr("m1670");
  if (bid < PRICE_MIN) return tr("m1671", { p0: PRICE_MIN.toLocaleString("vi-VN") });
  if (bid > PRICE_MAX) return tr("m1672", { p0: PRICE_MAX.toLocaleString("vi-VN") });
  return undefined;
}

export function validateProposalDuration(raw: string, tr: Tr): string | undefined {
  const duration = Number(raw);
  return !Number.isInteger(duration) || duration < 1 ? tr("m1674") : undefined;
}

export function validateProposalMessage(raw: string, tr: Tr): string | undefined {
  return sanitizeText(raw).length < 20 ? tr("m1675") : undefined;
}

export default function SubmitProposalPage({
  onNavigate,
  onShowToast,
  jobId
}: PageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId ?? "");
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobDetail | null>(null);
  const [bidRaw, setBidRaw] = useState("");
  const [durationRaw, setDurationRaw] = useState("");
  const [message, setMessage] = useState("");
  const [terms, setTerms] = useState("");
  const [errors, setErrors] = useState<{
    job?: string;
    bid?: string;
    duration?: string;
    message?: string;
    form?: string;
  }>({});

  // Guard states
  const [isWalletBlocked, setIsWalletBlocked] = useState(false);
  const [debtAmount, setDebtAmount] = useState(0);
  const [isSanctionBlocked, setIsSanctionBlocked] = useState(false);
  const [sanctionReason, setSanctionReason] = useState("");

  // Check Wallet debt and Sanction status on mount or token change
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    // 1. Check wallet balance & debt
    paymentApi.getWallet().then((res: unknown) => {
      if (cancelled) return;
      const r = res as { result?: Record<string, unknown> } & Record<string, unknown>;
      const data = r?.result ?? r ?? {};
      const debt = Number(data.outstandingFee ?? 0);
      const available = Number(data.balance ?? 0);
      if (debt > 0 || available < 0) {
        setIsWalletBlocked(true);
        setDebtAmount(debt > 0 ? debt : Math.abs(available));
      } else {
        setIsWalletBlocked(false);
        setDebtAmount(0);
      }
    }).catch(() => {
      // Non-blocking in dev / mock environment
    });

    // 2. Check provider profile & sanctions
    providerApi.getMyProfile().then((res: unknown) => {
      if (cancelled) return;
      const r = res as { result?: Record<string, unknown> } & Record<string, unknown>;
      const profile = r?.result ?? r ?? {};
      const verificationStatus = String(profile.verificationStatus ?? "");
      const isAcceptingOrders = profile.isAcceptingOrders !== false;
      const userStatus = String(profile.userStatus ?? "ACTIVE");

      if (verificationStatus === "SUSPENDED") {
        setIsSanctionBlocked(true);
        setSanctionReason("Tài khoản Chuyên gia đang trong diện tạm ngưng (SUSPENDED) do chế tài.");
      } else if (verificationStatus === "REJECTED") {
        setIsSanctionBlocked(true);
        setSanctionReason("Hồ sơ Chuyên gia bị từ chối xác thực. Bạn chưa thể nhận việc mới.");
      } else if (!isAcceptingOrders) {
        setIsSanctionBlocked(true);
        setSanctionReason("Trạng thái Chuyên gia đang cài đặt: Tạm ngừng nhận đơn hàng / việc mới.");
      } else if (userStatus !== "ACTIVE" && userStatus !== "") {
        setIsSanctionBlocked(true);
        setSanctionReason(`Tài khoản đang ở trạng thái ${userStatus}, không thể gửi đề xuất.`);
      } else {
        setIsSanctionBlocked(false);
        setSanctionReason("");
      }
    }).catch(() => {
      // Non-blocking in dev / mock environment
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load available jobs for selection dropdown
  useEffect(() => {
    let cancelled = false;
    jobApi.searchJobs({ page: 0, size: 50, sort: "createdAt,desc" }).then((res: { result?: { data?: unknown[] } }) => {
      if (cancelled) return;
      const apiList = (res?.result?.data || (Array.isArray(res?.result) ? res.result : [])) as Array<{
        jobId: string;
        title: string;
        budgetMin?: number;
        budgetMax?: number;
        currency?: string;
        executionType?: string;
        status?: string;
        applicationCount?: number;
        createdAt?: string;
      }>;
      if (Array.isArray(apiList)) {
        setJobs(apiList.map(j => ({
          jobId: j.jobId,
          title: j.title,
          description: "",
          budgetMin: Number(j.budgetMin ?? 0),
          budgetMax: Number(j.budgetMax ?? 0),
          currency: j.currency || "VND",
          executionType: (j.executionType as JobSummary["executionType"]) || "DIGITAL",
          status: j.status || "OPEN",
          applicationCount: Number(j.applicationCount ?? 0),
          createdAt: j.createdAt ? j.createdAt.slice(0, 10) : ""
        })));
      }
    }).catch(() => {
      // Backend not running or error
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load selected Job detail
  useEffect(() => {
    if (!selectedJobId) {
      return;
    }
    let cancelled = false;

    const fetchDetail = async () => {
      try {
        const res = (await jobApi.getJob(selectedJobId)) as { result?: JobDetail } & JobDetail;
        if (cancelled) return;
        const detail = res?.result ?? res;
        if (detail && detail.jobId) {
          setSelectedJobDetail(detail);
          setBidRaw(prev => (prev ? prev : detail.budgetMin ? String(detail.budgetMin) : ""));
        }
      } catch {
        // Fallback
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedJobId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check guards
    if (isWalletBlocked) {
      onShowToast(`Tài khoản đang nợ phí ${debtAmount.toLocaleString("vi-VN")} ₫. Vui lòng thanh toán trước khi gửi đề xuất.`);
      return;
    }

    if (isSanctionBlocked) {
      onShowToast(sanctionReason || "Tài khoản đang bị hạn chế nhận việc.");
      return;
    }

    const next: typeof errors = {
      job: validateProposalJob(selectedJobId, tr),
      bid: validateProposalBid(bidRaw, tr),
      duration: validateProposalDuration(durationRaw, tr),
      message: validateProposalMessage(message, tr)
    };
    setErrors(next);
    if (next.job || next.bid || next.duration || next.message) return;

    if (!token) {
      onShowToast("Vui lòng đăng nhập để gửi đề xuất việc làm.");
      return;
    }

    const bid = Number(String(bidRaw).replace(/[^\d]/g, ""));
    const duration = Number(durationRaw);
    const cleanMsg = sanitizeText(message);
    const cleanTerms = sanitizeText(terms);

    setSubmitting(true);
    setErrors(prev => ({ ...prev, form: undefined }));

    try {
      let applicationId: string | null = null;

      // Step 1: Attempt to apply to the job
      try {
        const appRes = await jobApi.applyJob(selectedJobId, { message: cleanMsg });
        const resData = (appRes as { result?: { applicationId?: string } })?.result;
        applicationId = resData?.applicationId ?? null;
      } catch (applyErr: unknown) {
        // If already applied (e.g. 409 or already applied code), look up existing applicationId
        try {
          const myApps = await jobApi.getMyApplications({ page: 0, size: 50 });
          const myAppsList = (myApps as { result?: { data?: Array<{ applicationId: string; job?: { jobId: string }; jobId?: string }> } })?.result?.data ?? [];
          const existingApp = myAppsList.find(a => (a.job?.jobId === selectedJobId) || (a.jobId === selectedJobId));
          if (existingApp?.applicationId) {
            applicationId = existingApp.applicationId;
          } else {
            throw applyErr;
          }
        } catch {
          throw applyErr;
        }
      }

      if (!applicationId) {
        throw new Error("Không thể khởi tạo hoặc tìm thấy hồ sơ ứng tuyển cho công việc này.");
      }

      // Step 2: Submit the proposal with price, estimatedDays, message, terms
      await jobApi.submitProposal(applicationId, {
        price: bid,
        estimatedDays: duration,
        message: cleanMsg,
        ...(cleanTerms && { terms: cleanTerms }),
      });

      onShowToast(tr("m1210"));
      onNavigate("proposal-review", {
        jobId: selectedJobId
      });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || tr("m1140");
      onShowToast(msg);
      setErrors(prev => ({
        ...prev,
        form: msg
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <Send size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1167")}
        </h1>
        <p className={styles.sub}>{tr("m1215")}</p>

        {/* Guard 1: Negative Wallet Balance Banner */}
        {isWalletBlocked && (
          <div className={styles.guardBanner} role="alert" aria-live="assertive">
            <div className={styles.guardTitle}>
              <AlertTriangle size={20} />
              Cảnh báo: Tài khoản đang có số dư nợ phí ({debtAmount.toLocaleString("vi-VN")} ₫)
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem" }}>
              Theo quy định của WorkGo, bạn cần thanh toán dứt điểm các khoản nợ phí nền tảng trước khi gửi báo giá hoặc nhận công việc mới.
            </p>
            <button
              type="button"
              className={styles.guardAction}
              onClick={() => onNavigate("payment-gateway", { amount: String(debtAmount) })}
            >
              Nạp tiền thanh toán nợ ngay <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </button>
          </div>
        )}

        {/* Guard 2: Sanction / Suspension Banner */}
        {isSanctionBlocked && (
          <div className={styles.guardBanner} role="alert" aria-live="assertive">
            <div className={styles.guardTitle}>
              <ShieldAlert size={20} />
              Giới hạn nhận việc: {sanctionReason}
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem" }}>
              Tài khoản Chuyên gia đang bị hạn chế thao tác nhận việc mới. Vui lòng kiểm tra và giải quyết các khiếu nại chưa xử lý để gỡ bỏ chế tài.
            </p>
            <button
              type="button"
              className={styles.guardAction}
              onClick={() => onNavigate("dispute-center")}
            >
              Mở Trung tâm Khiếu nại <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </button>
          </div>
        )}

        {/* Selected Job Overview */}
        {selectedJobDetail && (
          <div className={styles.jobPreview}>
            <div className={styles.jobPreviewTitle}>
              <Briefcase size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
              {selectedJobDetail.title}
            </div>
            <div className={styles.jobPreviewMeta}>
              <span>Hình thức: <strong>{selectedJobDetail.executionType}</strong></span>
              <span>Ngân sách khách: <strong>{selectedJobDetail.budgetMin?.toLocaleString("vi-VN")} ₫</strong></span>
              {selectedJobDetail.deadlineAt && (
                <span>Hạn chót: <strong>{selectedJobDetail.deadlineAt.slice(0, 10)}</strong></span>
              )}
            </div>
            {selectedJobDetail.description && (
              <p style={{ fontSize: "0.85rem", color: "var(--wg-text-secondary)", marginTop: "8px", marginBottom: 0 }}>
                {selectedJobDetail.description.length > 150
                  ? `${selectedJobDetail.description.slice(0, 150)}...`
                  : selectedJobDetail.description}
              </p>
            )}
          </div>
        )}

        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>{tr("m1216")} *</span>
            <select
              value={selectedJobId}
              onChange={e => {
                setSelectedJobId(e.target.value);
                if (errors.job) {
                  setErrors(prev => ({
                    ...prev,
                    job: validateProposalJob(e.target.value, tr)
                  }));
                }
              }}
              onBlur={() =>
                setErrors(prev => ({
                  ...prev,
                  job: validateProposalJob(selectedJobId, tr)
                }))
              }
              aria-describedby={errors.job ? "proposal-job-error" : undefined}
            >
              <option value="">{tr("m1217")}</option>
              {jobs.map(j => (
                <option key={j.jobId} value={j.jobId}>
                  {j.title} ({j.budgetMin ? `${j.budgetMin.toLocaleString("vi-VN")} ₫` : "Thỏa thuận"})
                </option>
              ))}
            </select>
            {errors.job && (
              <em id="proposal-job-error" className={styles.error}>
                {errors.job}
              </em>
            )}
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>{tr("m1218")} (VNĐ) *</span>
              <input
                value={bidRaw}
                onChange={e => {
                  setBidRaw(e.target.value);
                  if (errors.bid) {
                    setErrors(prev => ({
                      ...prev,
                      bid: validateProposalBid(e.target.value, tr)
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    bid: validateProposalBid(bidRaw, tr)
                  }))
                }
                placeholder="2000000"
                inputMode="numeric"
                aria-describedby={errors.bid ? "proposal-bid-error" : undefined}
              />
              {errors.bid && (
                <em id="proposal-bid-error" className={styles.error}>
                  {errors.bid}
                </em>
              )}
            </label>

            <label className={styles.field}>
              <span>{tr("m1219")} (ngày) *</span>
              <input
                value={durationRaw}
                onChange={e => {
                  setDurationRaw(e.target.value);
                  if (errors.duration) {
                    setErrors(prev => ({
                      ...prev,
                      duration: validateProposalDuration(e.target.value, tr)
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    duration: validateProposalDuration(durationRaw, tr)
                  }))
                }
                placeholder="5"
                inputMode="numeric"
                aria-describedby={errors.duration ? "proposal-duration-error" : undefined}
              />
              {errors.duration && (
                <em id="proposal-duration-error" className={styles.error}>
                  {errors.duration}
                </em>
              )}
            </label>
          </div>

          <label className={styles.field}>
            <span>{tr("m1220")} (Thư ứng tuyển) *</span>
            <textarea
              value={message}
              onChange={e => {
                setMessage(e.target.value);
                if (errors.message) {
                  setErrors(prev => ({
                    ...prev,
                    message: validateProposalMessage(e.target.value, tr)
                  }));
                }
              }}
              onBlur={() =>
                setErrors(prev => ({
                  ...prev,
                  message: validateProposalMessage(message, tr)
                }))
              }
              rows={5}
              placeholder={tr("m1211")}
              aria-describedby={errors.message ? "proposal-message-error" : undefined}
            />
            {errors.message && (
              <em id="proposal-message-error" className={styles.error}>
                {errors.message}
              </em>
            )}
          </label>

          <label className={styles.field}>
            <span>Cam kết thực hiện & Điều khoản đề xuất (tùy chọn)</span>
            <textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Bảo hành 3 tháng, hỗ trợ chỉnh sửa tối đa 3 lần, bàn giao đầy đủ mã nguồn..."
            />
          </label>

          {errors.form && (
            <p className={styles.error} style={{ marginTop: "8px" }}>
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={submitting || isWalletBlocked || isSanctionBlocked}
            title={
              isWalletBlocked
                ? "Tài khoản đang có công nợ ví"
                : isSanctionBlocked
                ? "Tài khoản đang bị hạn chế nhận việc"
                : undefined
            }
          >
            {submitting ? tr("m1143") : tr("m1167")}
          </button>
        </form>
      </div>
    </main>
  );
}
