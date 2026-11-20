"use client";

// Trung Tâm Khiếu Nại Demo
import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import {
  ShieldAlert,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  ChevronDown,
  ChevronUp,
  Scale,
  RefreshCw,
  Send,
} from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import {
  trustApi,
  providerApi,
  orderApi,
  useAuthToken,
  decodeToken,
  compressImage,
} from "../../webapp-bridge/backend";
import type {
  Dispute,
  DisputeKind,
  DisputeStatus,
  ReportTargetType,
  SupplementaryEvidence,
  ReputationLedgerEntry,
  ProviderSanction,
  SanctionAppeal,
  SettlementStatus,
} from "./types";
import styles from "./DisputeCenterPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  orderId?: string;
};

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

export const QUOTA_ERROR_MESSAGE = "Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.";

const DEFAULT_REPUTATION_LEDGER: ReputationLedgerEntry[] = [
  {
    id: "REP-001",
    timestamp: "2026-10-15 14:30",
    event: "Hoàn thành đơn hàng đúng hạn và đạt chuẩn",
    source: "ORDER_COMPLETED",
    delta: 5,
    balance: 85,
    referenceId: "ORD-1042",
    note: "Khách hàng nghiệm thu đạt chất lượng 100%",
  },
  {
    id: "REP-002",
    timestamp: "2026-10-10 09:15",
    event: "Nhận đánh giá 5 sao từ khách hàng",
    source: "REVIEW_5_STAR",
    delta: 2,
    balance: 80,
    referenceId: "ORD-1038",
    note: "Đánh giá xuất sắc về thái độ và chuyên môn",
  },
  {
    id: "REP-003",
    timestamp: "2026-10-02 16:45",
    event: "Trễ hạn bàn giao công việc 1 ngày",
    source: "LATE_DELIVERY",
    delta: -1,
    balance: 78,
    referenceId: "ORD-1019",
    note: "Khấu trừ theo công thức n(n+1)/2 (n=1)",
  },
];

export default function DisputeCenterPage({
  onShowToast,
  orderId: initialOrderId,
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const decoded = decodeToken(token);
  const providerId = (decoded as { providerId?: string })?.providerId;

  // Eligible orders for dispute/report picker
  const [eligibleDisputeOrders, setEligibleDisputeOrders] = useState<string[]>([]);
  const [loadingDisputeOrders, setLoadingDisputeOrders] = useState(Boolean(token && !initialOrderId));

  useEffect(() => {
    if (!token || initialOrderId) return undefined;
    let cancelled = false;
    orderApi
      .getMyOrders("CLIENT", 0, 50)
      .then((res: unknown) => {
        if (cancelled) return;
        const data = (res as { result?: { data?: unknown[] } })?.result?.data;
        const list = Array.isArray(data) ? data : [];
        const ids = list
          .map((o: unknown) => {
            const order = (o as { order?: { orderId?: string } })?.order ?? (o as { orderId?: string });
            return String(order?.orderId ?? "");
          })
          .filter(Boolean);
        setEligibleDisputeOrders(Array.from(new Set(ids)));
      })
      .catch(() => {
        if (!cancelled) setEligibleDisputeOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDisputeOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, initialOrderId]);

  // Active tab
  const [activeTab, setActiveTab] = useState<"disputes" | "reputation" | "sanctions">("disputes");

  // Dispute / Report state
  const [items, setItems] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<"ALL" | DisputeStatus>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [kind, setKind] = useState<DisputeKind>("DISPUTE");
  const [orderId, setOrderId] = useState(initialOrderId ?? "");
  const [targetType, setTargetType] = useState<ReportTargetType>("USER");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidencePreview, setEvidencePreview] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Supplement evidence state (per dispute)
  const [supplementingTicket, setSupplementingTicket] = useState<string | null>(null);
  const [supplementUrl, setSupplementUrl] = useState("");
  const [supplementNote, setSupplementNote] = useState("");
  const [submittingSupplement, setSubmittingSupplement] = useState(false);

  // Reputation & Ledger state
  const [reputationScore, setReputationScore] = useState<number>(85);
  const [reputationLedger, setReputationLedger] = useState<ReputationLedgerEntry[]>(DEFAULT_REPUTATION_LEDGER);

  // Sanctions & Appeal state
  const [sanctions, setSanctions] = useState<ProviderSanction[]>([]);
  const [appealRefId, setAppealRefId] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [appealExplanation, setAppealExplanation] = useState("");
  const [appealEvidence, setAppealEvidence] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [submittedAppeals, setSubmittedAppeals] = useState<SanctionAppeal[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supplementFileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch user disputes
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    trustApi.getMyDisputes({ size: 50 })
      .then((res: { result?: { data?: unknown[] } }) => {
        if (cancelled) return;
        const apiDisputes = (res?.result?.data || (Array.isArray(res?.result) ? res.result : [])) as Array<{
          disputeId?: string;
          orderId?: string;
          reason?: string;
          description?: string;
          evidenceUrl?: string;
          status?: string;
          resolution?: string;
          createdAt?: string;
          resolvedAt?: string;
          openedBy?: string;
          openedByRole?: string;
        }>;

        if (Array.isArray(apiDisputes)) {
          setItems(
            apiDisputes
              .filter(d => Boolean(d.disputeId))
              .map(d => {
                const status = (d.status as DisputeStatus) || "OPEN";
                let settlementStatus: SettlementStatus = "FROZEN";
                let decisionType: "RELEASE" | "REFUND" | "SPLIT" = "RELEASE";

                if (status === "RESOLVED" || status === "RESOLVED_CLIENT") {
                  settlementStatus = "REFUNDED";
                  decisionType = "REFUND";
                } else if (status === "RESOLVED_PROVIDER") {
                  settlementStatus = "SETTLED";
                  decisionType = "RELEASE";
                } else if (status === "CLOSED" && d.resolution?.toLowerCase().includes("split")) {
                  settlementStatus = "SPLIT_COMPLETED";
                  decisionType = "SPLIT";
                }

                return {
                  id: d.disputeId!,
                  ticketId: d.disputeId!,
                  kind: "DISPUTE",
                  orderId: d.orderId || "",
                  openedBy: d.openedBy,
                  openedByRole: (d.openedByRole as "CLIENT" | "PROVIDER") || "CLIENT",
                  reason: d.reason || d.description || "",
                  description: d.description || "",
                  evidenceUrl: d.evidenceUrl || undefined,
                  status,
                  resolution: d.resolution,
                  resolvedAt: d.resolvedAt,
                  createdAt: d.createdAt ? d.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                  decision:
                    status === "RESOLVED" ||
                    status === "RESOLVED_CLIENT" ||
                    status === "RESOLVED_PROVIDER" ||
                    Boolean(d.resolution)
                      ? {
                          type: decisionType,
                          reason: d.resolution || "Phán quyết chính thức từ Hội đồng Admin WorkGo.",
                          decidedAt: d.resolvedAt ? d.resolvedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
                          settlementStatus,
                          providerPercent: decisionType === "SPLIT" ? 50 : decisionType === "RELEASE" ? 100 : 0,
                          clientPercent: decisionType === "SPLIT" ? 50 : decisionType === "REFUND" ? 100 : 0,
                        }
                      : undefined,
                };
              })
          );
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // 2. Fetch Provider Reputation & Sanctions
  useEffect(() => {
    if (!token || !providerId) return undefined;
    let cancelled = false;

    // Fetch provider profile or reputation
    trustApi
      .getReputation(providerId)
      .then((res: { result?: { score?: number; ledger?: ReputationLedgerEntry[] } } | null) => {
        if (cancelled || !res?.result) return;
        if (typeof res.result.score === "number") setReputationScore(res.result.score);
        if (Array.isArray(res.result.ledger) && res.result.ledger.length > 0) {
          setReputationLedger(res.result.ledger);
        }
      })
      .catch(() => {
        // Fallback to providerApi profile rating
        providerApi.getMyProfile().then((pres: { result?: { ratingAvg?: number } }) => {
          if (cancelled || !pres?.result) return;
          const avg = pres.result.ratingAvg || 4.25;
          setReputationScore(Math.round(Math.min(100, Math.max(0, avg * 20))));
        }).catch(() => undefined);
      });

    // Fetch provider sanctions
    trustApi
      .getSanctions(providerId)
      .then((res: { result?: ProviderSanction[] } | null) => {
        if (cancelled || !res?.result) return;
        if (Array.isArray(res.result)) setSanctions(res.result);
      })
      .catch(() => {
        if (!cancelled) setSanctions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token, providerId]);

  // Evidence file upload handler
  const handleEvidenceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    try {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        setEvidenceUrl(compressed);
        setEvidencePreview(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result ?? "");
          setEvidenceUrl(res);
          setEvidencePreview(res);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Không xử lý được file tải lên.");
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Supplement evidence file upload handler
  const handleSupplementFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        setSupplementUrl(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setSupplementUrl(String(reader.result ?? ""));
        };
        reader.readAsDataURL(file);
      }
    } catch {
      onShowToast("Không đọc được file ảnh bổ sung.");
    }
  };

  // Submit dispute or report
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrder = sanitizeText(orderId);
    const cleanTargetId = sanitizeText(targetId);
    const cleanReason = sanitizeText(reason);
    const cleanDesc = sanitizeText(description);
    const cleanEvidence = sanitizeText(evidenceUrl);

    if (!token) {
      setError("Vui lòng đăng nhập để gửi khiếu nại.");
      return;
    }

    if (kind === "DISPUTE") {
      if (cleanOrder.length < 2) {
        setError(tr("m1400")); // "Vui lòng nhập mã đơn hàng!"
        return;
      }
    } else if (cleanTargetId.length < 2) {
      setError("Vui lòng nhập mã đối tượng báo cáo!");
      return;
    }

    // Reason must be >= 20 characters
    if (cleanReason.length < 20) {
      setError("Vui lòng nhập lý do chi tiết từ 20 ký tự trở lên!");
      return;
    }

    // Validate URL if not empty and not data URL
    if (cleanEvidence !== "" && !cleanEvidence.startsWith("data:")) {
      try {
        const u = new URL(cleanEvidence);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad");
      } catch {
        setError(tr("m1402")); // "Link minh chứng chưa đúng định dạng URL!"
        return;
      }
    }

    setError("");
    setSubmitting(true);

    try {
      let newId = "";
      if (kind === "DISPUTE") {
        const res = await trustApi.createDispute({
          orderId: cleanOrder,
          reason: cleanReason,
          description: cleanDesc || cleanReason,
          evidenceUrl: cleanEvidence || undefined,
        });
        newId = res?.result?.disputeId || `DISP-${Date.now()}`;
      } else {
        const res = await trustApi.submitReport({
          targetType,
          targetId: cleanTargetId,
          reason: cleanReason,
          description: cleanDesc || cleanReason,
          evidenceUrl: cleanEvidence || undefined,
        });
        newId = res?.result?.reportId || `REP-${Date.now()}`;
      }

      const newDispute: Dispute = {
        id: newId,
        ticketId: newId,
        kind,
        orderId: kind === "DISPUTE" ? cleanOrder : `TARGET-${cleanTargetId}`,
        targetType: kind === "REPORT" ? targetType : undefined,
        targetId: cleanTargetId,
        openedByRole: "CLIENT",
        reason: cleanReason,
        description: cleanDesc,
        evidenceUrl: cleanEvidence || undefined,
        status: "OPEN",
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setItems(prev => [newDispute, ...prev]);
      setOrderId("");
      setTargetId("");
      setReason("");
      setDescription("");
      setEvidenceUrl("");
      setEvidencePreview("");
      setShowCreateForm(false);
      onShowToast(tr("m1403")); // "Đã gửi phiếu hỗ trợ, WorkGo sẽ phản hồi sớm!"
    } catch (err: unknown) {
      const msg = (err as Error)?.message || tr("m1140");
      setError(msg);
      onShowToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel dispute
  const cancelDispute = async (id: string) => {
    try {
      await trustApi.cancelDispute(id, { reason: "Người dùng chủ động hủy yêu cầu khiếu nại" });
      setItems(prev =>
        prev.map(d =>
          d.id === id
            ? {
                ...d,
                status: "CANCELLED",
                resolution: "Người dùng chủ động rút đơn khiếu nại.",
                resolvedAt: new Date().toISOString().slice(0, 10),
              }
            : d
        )
      );
      onShowToast("Đã hủy đơn khiếu nại thành công.");
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || "Không hủy được khiếu nại.");
    }
  };

  // Submit supplementary evidence on admin request
  const submitSupplement = async (ticketId: string) => {
    const cleanUrl = sanitizeText(supplementUrl);
    const cleanNote = sanitizeText(supplementNote);

    if (!cleanUrl && !cleanNote) {
      onShowToast("Vui lòng đính kèm chứng cứ hoặc lời giải trình.");
      return;
    }

    setSubmittingSupplement(true);
    try {
      await trustApi.supplementEvidence(ticketId, {
        evidenceUrl: cleanUrl,
        note: cleanNote,
      });

      const newEvidence: SupplementaryEvidence = {
        evidenceUrl: cleanUrl,
        note: cleanNote,
        submittedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      };

      setItems(prev =>
        prev.map(d =>
          d.ticketId === ticketId
            ? {
                ...d,
                supplementaryEvidences: [...(d.supplementaryEvidences || []), newEvidence],
              }
            : d
        )
      );

      setSupplementingTicket(null);
      setSupplementUrl("");
      setSupplementNote("");
      onShowToast("Đã bổ sung chứng cứ thành công tới Ban Quản Trị.");
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || "Không gửi được chứng cứ bổ sung.");
    } finally {
      setSubmittingSupplement(false);
    }
  };

  // Submit Sanction Appeal
  const submitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = sanitizeText(appealRefId);
    const cleanReason = sanitizeText(appealReason);
    const cleanExp = sanitizeText(appealExplanation);
    const cleanEvidence = sanitizeText(appealEvidence);

    if (cleanReason.length < 20) {
      onShowToast("Lý do kháng nghị phải từ 20 ký tự trở lên!");
      return;
    }

    setSubmittingAppeal(true);
    try {
      const res = await trustApi.submitAppeal({
        sanctionId: cleanRef || "SNC-GENERAL",
        reason: cleanReason,
        explanation: cleanExp,
        evidenceUrl: cleanEvidence || undefined,
      });

      const appealId = res?.result?.appealId || `APP-${Date.now()}`;
      setSubmittedAppeals(prev => [
        {
          id: appealId,
          sanctionId: cleanRef,
          reason: cleanReason,
          explanation: cleanExp,
          evidenceUrl: cleanEvidence || undefined,
          status: "PENDING",
          submittedAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);

      setAppealRefId("");
      setAppealReason("");
      setAppealExplanation("");
      setAppealEvidence("");
      onShowToast("Đã gửi đơn kháng nghị tới SUPER_ADMIN. Hệ thống sẽ xem xét trong 48 giờ.");
    } catch (err: unknown) {
      onShowToast((err as Error)?.message || "Không gửi được đơn kháng nghị.");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const visible = items.filter(t => (filter === "ALL" ? true : t.status === filter));

  // Determine reputation tier
  const getReputationTier = (score: number) => {
    if (score >= 80) return { label: "Hạng A — Xuất sắc (Uy tín cao)", cls: styles.tierA, maxOrders: "Không giới hạn" };
    if (score >= 60) return { label: "Hạng B — Tốt (Tiêu chuẩn)", cls: styles.tierB, maxOrders: "5 việc đồng thời" };
    if (score >= 40) return { label: "Hạng C — Trung bình (Cần cải thiện)", cls: styles.tierC, maxOrders: "3 việc đồng thời" };
    if (score >= 20) return { label: "Hạng D — Cảnh báo (Hạn chế nhận việc)", cls: styles.tierD, maxOrders: "1 việc đồng thời" };
    return { label: "Hạng E — Nguy cơ khóa tài khoản", cls: styles.tierE, maxOrders: "Tạm đình chỉ nhận việc" };
  };

  const currentTier = getReputationTier(reputationScore);

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>
        <ShieldAlert size={28} className={styles.titleIcon} aria-hidden="true" />
        {tr("m1410")}
      </h1>
      <p className={styles.sub}>{tr("m1412")}</p>

      {/* Tabs */}
      <nav className={styles.tabs} aria-label="Khu vực tin cậy">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "disputes" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("disputes")}
        >
          <FileText size={18} />
          Khiếu nại & Tranh chấp ({items.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "reputation" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("reputation")}
        >
          <Award size={18} />
          Điểm uy tín Provider ({reputationScore}/100)
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "sanctions" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("sanctions")}
        >
          <AlertTriangle size={18} />
          Chế tài & Kháng nghị ({sanctions.length})
        </button>
      </nav>

      {/* TAB 1: DISPUTES & REPORTS */}
      {activeTab === "disputes" && (
        <>
          <div className={styles.actionBar}>
            <div className={styles.filterRow} role="group" aria-label={tr("m1405")}>
              {(["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "CANCELLED"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  className={s === filter ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                  aria-pressed={s === filter}
                  onClick={() => setFilter(s)}
                >
                  {s === "ALL"
                    ? "Tất cả"
                    : s === "OPEN"
                    ? "Đang mở"
                    : s === "UNDER_REVIEW"
                    ? "Đang thẩm định"
                    : s === "RESOLVED"
                    ? "Đã giải quyết"
                    : "Đã hủy"}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowCreateForm(prev => !prev)}
            >
              {showCreateForm ? "Đóng biểu mẫu" : "+ Gửi khiếu nại / Báo cáo"}
            </button>
          </div>

          {/* Form */}
          {showCreateForm && (
            <form onSubmit={submit} noValidate className={styles.form}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  {kind === "DISPUTE" ? "Tạo phiếu khiếu nại đơn hàng" : "Gửi báo cáo vi phạm"}
                </h2>
              </div>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>{tr("m1413")}</span>
                  <select value={kind} onChange={e => setKind(e.target.value as DisputeKind)}>
                    <option value="DISPUTE">{tr("m59")}</option>
                    <option value="REPORT">{tr("m1408")}</option>
                  </select>
                </label>

                {kind === "DISPUTE" ? (
                  <label className={styles.field}>
                    <span>{tr("m1416")}</span>
                    {initialOrderId || eligibleDisputeOrders.length === 0 ? (
                      <input
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                        placeholder="ORD-1042"
                        disabled={Boolean(initialOrderId)}
                      />
                    ) : (
                      <select
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                        disabled={loadingDisputeOrders}
                      >
                        <option value="">{loadingDisputeOrders ? "Đang tải đơn hàng..." : "Chọn đơn hàng"}</option>
                        {eligibleDisputeOrders.map(id => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                ) : (
                  <label className={styles.field}>
                    <span>Đối tượng vi phạm</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={targetType}
                        onChange={e => setTargetType(e.target.value as ReportTargetType)}
                        style={{ maxWidth: "120px" }}
                      >
                        <option value="USER">User</option>
                        <option value="JOB">Job</option>
                        <option value="SERVICE">Dịch vụ</option>
                        <option value="ORDER">Đơn hàng</option>
                        <option value="REVIEW">Đánh giá</option>
                        <option value="MESSAGE">Tin nhắn</option>
                      </select>
                      <input
                        value={targetId}
                        onChange={e => setTargetId(e.target.value)}
                        placeholder="ID đối tượng (UUID / Code)"
                      />
                    </div>
                  </label>
                )}
              </div>

              <label className={styles.field}>
                <span>{tr("m1417")}</span>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Lý do tóm tắt (tối thiểu 20 ký tự trở lên)..."
                />
              </label>

              <label className={styles.field}>
                <span>Mô tả chi tiết sự việc</span>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder={tr("m1404")}
                />
              </label>

              <div className={styles.uploadRow}>
                <label className={styles.field}>
                  <span>{tr("m1418")}</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      value={evidenceUrl.startsWith("data:") ? "[Đã đính kèm ảnh chụp/tài liệu]" : evidenceUrl}
                      onChange={e => {
                        setEvidenceUrl(e.target.value);
                        setEvidencePreview("");
                      }}
                      placeholder="https://..."
                      inputMode="url"
                      readOnly={evidenceUrl.startsWith("data:")}
                    />
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingEvidence}
                    >
                      <Upload size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      {uploadingEvidence ? "Đang xử lý..." : "Chọn file ảnh"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className={styles.fileInput}
                      onChange={handleEvidenceFile}
                    />
                  </div>
                </label>
                {evidencePreview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={evidencePreview} alt="Minh chứng đính kèm" className={styles.previewThumb} />
                )}
              </div>

              {error ? <em className={styles.error}>{error}</em> : null}
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className={styles.submit} disabled={submitting}>
                  {submitting ? "Đang gửi..." : tr("m1419")}
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setShowCreateForm(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Dispute List */}
          {visible.length === 0 ? (
            <p className={styles.empty}>{tr("m1421")}</p>
          ) : (
            <ul className={styles.list}>
              {visible.map(t => (
                <li key={t.ticketId} className={styles.item}>
                  <button
                    type="button"
                    className={styles.itemHead}
                    aria-expanded={expanded === t.ticketId}
                    onClick={() => setExpanded(expanded === t.ticketId ? null : t.ticketId)}
                  >
                    <span className={styles.ticketId}>{t.ticketId}</span>
                    <span
                      className={`${styles.kind} ${t.kind === "REPORT" ? styles.kindReport : ""}`}
                    >
                      {t.kind === "REPORT" ? tr("m1408") : tr("m59")}
                    </span>
                    <span className={styles.order}>Đơn: {t.orderId}</span>
                    <span className={styles.status} data-status={t.status}>
                      {t.status === "OPEN"
                        ? "Đang mở"
                        : t.status === "UNDER_REVIEW"
                        ? "Đang thẩm định"
                        : t.status === "RESOLVED" ||
                          t.status === "RESOLVED_CLIENT" ||
                          t.status === "RESOLVED_PROVIDER"
                        ? "Đã giải quyết"
                        : "Đã đóng / Hủy"}
                    </span>
                    {expanded === t.ticketId ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expanded === t.ticketId && (
                    <div className={styles.detail}>
                      <div className={styles.detailMeta}>
                        <span>Người mở: {t.openedByRole || "Thành viên"}</span>
                        <span>Ngày tạo: {t.createdAt}</span>
                        {t.resolvedAt && <span>Ngày giải quyết: {t.resolvedAt}</span>}
                      </div>

                      <p className={styles.reason}>{t.reason}</p>
                      {t.description && <p className={styles.description}>{t.description}</p>}

                      {t.evidenceUrl && (
                        <div className={styles.evidenceSection}>
                          <strong>Minh chứng ban đầu: </strong>
                          {t.evidenceUrl.startsWith("data:") ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={t.evidenceUrl} alt="Minh chứng" className={styles.previewThumb} style={{ display: "block", marginTop: 6 }} />
                          ) : (
                            <a href={t.evidenceUrl} target="_blank" rel="noreferrer" className={styles.evidenceLink}>
                              {t.evidenceUrl}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Supplementary Evidences List */}
                      {t.supplementaryEvidences && t.supplementaryEvidences.length > 0 && (
                        <div className={styles.evidenceSection}>
                          <strong>Chứng cứ bổ sung đối chất:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {t.supplementaryEvidences.map((ev, idx) => (
                              <li key={idx} style={{ marginBottom: 6 }}>
                                <span>[{ev.submittedAt}] </span>
                                <em>{ev.note || "Bổ sung ảnh/tài liệu đối chiếu"}</em>
                                {ev.evidenceUrl && ev.evidenceUrl.startsWith("data:") ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={ev.evidenceUrl} alt="Bổ sung" className={styles.previewThumb} style={{ display: "block", marginTop: 4 }} />
                                ) : ev.evidenceUrl ? (
                                  <a href={ev.evidenceUrl} target="_blank" rel="noreferrer" className={styles.evidenceLink} style={{ marginLeft: 6 }}>
                                    Xem link
                                  </a>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* DISPUTE TIMELINE */}
                      <div className={styles.timelineCard}>
                        <h3 className={styles.timelineTitle}>
                          <Clock size={16} /> Dòng thời gian tiến trình hòa giải
                        </h3>
                        <div className={styles.timeline}>
                          <div className={styles.timelineItem}>
                            <span className={`${styles.timelineMarker} ${styles.markerDone}`} />
                            <h4 className={styles.timelineStepTitle}>1. Tiếp nhận hồ sơ khiếu nại</h4>
                            <p className={styles.timelineStepDesc}>
                              Hệ thống tự động kích hoạt bảo vệ: Tiền ký quỹ (Escrow) được đóng băng an toàn (FROZEN).
                            </p>
                            <span className={styles.timelineStepTime}>{t.createdAt}</span>
                          </div>

                          <div className={styles.timelineItem}>
                            <span
                              className={`${styles.timelineMarker} ${
                                t.status !== "OPEN" ? styles.markerDone : styles.markerActive
                              }`}
                            />
                            <h4 className={styles.timelineStepTitle}>2. Thẩm định & Xác minh</h4>
                            <p className={styles.timelineStepDesc}>
                              Trọng tài viên kiểm tra phạm vi thỏa thuận đơn hàng, các tin nhắn và bằng chứng hiện trường.
                            </p>
                          </div>

                          <div className={styles.timelineItem}>
                            <span
                              className={`${styles.timelineMarker} ${
                                t.supplementaryEvidences && t.supplementaryEvidences.length > 0
                                  ? styles.markerDone
                                  : t.status === "UNDER_REVIEW"
                                  ? styles.markerActive
                                  : ""
                              }`}
                            />
                            <h4 className={styles.timelineStepTitle}>3. Yêu cầu & Bổ sung chứng cứ đối chất</h4>
                            <p className={styles.timelineStepDesc}>
                              Hai bên gửi thêm hợp đồng, biên bản nghiệm thu hoặc ảnh đối chứng nếu có phát sinh tranh luận.
                            </p>
                          </div>

                          <div className={styles.timelineItem}>
                            <span
                              className={`${styles.timelineMarker} ${
                                t.status === "RESOLVED" ||
                                t.status === "RESOLVED_CLIENT" ||
                                t.status === "RESOLVED_PROVIDER"
                                  ? styles.markerDone
                                  : ""
                              }`}
                            />
                            <h4 className={styles.timelineStepTitle}>4. Phán quyết giải quyết & Thực thi tài chính</h4>
                            <p className={styles.timelineStepDesc}>
                              Ban Quản Trị ban hành 1 trong 3 kết quả hòa giải và tự động giải ngân / hoàn tiền.
                            </p>
                            {t.resolvedAt && <span className={styles.timelineStepTime}>{t.resolvedAt}</span>}
                          </div>
                        </div>
                      </div>

                      {/* 3-WAY ADMIN DECISION & FINANCIAL SETTLEMENT */}
                      <div className={styles.decisionBox}>
                        <div className={styles.decisionHeader}>
                          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            <Scale size={18} /> Phán quyết hòa giải 3 chiều (Admin 3-Way Decision)
                          </h4>
                          {t.decision ? (
                            <span
                              className={`${styles.settlementBadge} ${
                                t.decision.settlementStatus === "SETTLED"
                                  ? styles.settlementSETTLED
                                  : t.decision.settlementStatus === "REFUNDED"
                                  ? styles.settlementREFUNDED
                                  : t.decision.settlementStatus === "SPLIT_COMPLETED"
                                  ? styles.settlementSPLIT
                                  : styles.settlementFROZEN
                              }`}
                            >
                              Thực thi tài chính: {t.decision.settlementStatus}
                            </span>
                          ) : (
                            <span className={`${styles.settlementBadge} ${styles.settlementFROZEN}`}>
                              Ký quỹ: FROZEN (Tạm giữ an toàn)
                            </span>
                          )}
                        </div>

                        <div className={styles.decisionThreeGrid}>
                          <div
                            className={`${styles.decisionItem} ${
                              t.decision?.type === "RELEASE" ? styles.decisionSelected : ""
                            }`}
                          >
                            <span className={styles.decisionTypeTitle} style={{ color: "#16a34a" }}>
                              <CheckCircle size={16} /> 1. RELEASE (Bên Cung Cấp)
                            </span>
                            <span className={styles.decisionTypeDesc}>
                              Giải phóng 100% tiền ký quỹ cho Provider khi công việc hoàn thành đúng thỏa thuận.
                            </span>
                          </div>

                          <div
                            className={`${styles.decisionItem} ${
                              t.decision?.type === "REFUND" ? styles.decisionSelected : ""
                            }`}
                          >
                            <span className={styles.decisionTypeTitle} style={{ color: "#0284c7" }}>
                              <RefreshCw size={16} /> 2. REFUND (Khách Hàng)
                            </span>
                            <span className={styles.decisionTypeDesc}>
                              Hoàn tiền 100% về ví Khách Hàng do Provider vi phạm cam kết hoặc không bàn giao.
                            </span>
                          </div>

                          <div
                            className={`${styles.decisionItem} ${
                              t.decision?.type === "SPLIT" ? styles.decisionSelected : ""
                            }`}
                          >
                            <span className={styles.decisionTypeTitle} style={{ color: "#9333ea" }}>
                              <Scale size={16} /> 3. SPLIT (Hòa Giải Chia Đôi)
                            </span>
                            <span className={styles.decisionTypeDesc}>
                              Phân chia giá trị theo tỷ lệ công việc thực tế (Ví dụ: 50% Khách - 50% Thợ).
                            </span>
                          </div>
                        </div>

                        {t.decision ? (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "#ffffff", borderRadius: 8, border: "1px solid var(--wg-border)" }}>
                            <strong>Kết luận chính thức ({t.decision.type}): </strong>
                            <span>{t.decision.reason}</span>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                              Ngày ban hành: {t.decision.decidedAt}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic", marginTop: 6 }}>
                            Đang trong quá trình thẩm định. Admin sẽ đối chiếu và ra phán quyết cuối cùng theo 3 phương án trên.
                          </div>
                        )}
                      </div>

                      {/* SUPPLEMENT EVIDENCE ACCORDION */}
                      {supplementingTicket === t.ticketId ? (
                        <div className={styles.supplementBox}>
                          <h4 className={styles.supplementTitle}>
                            <Send size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                            Bổ sung chứng cứ đối chất theo yêu cầu Admin
                          </h4>
                          <textarea
                            value={supplementNote}
                            onChange={e => setSupplementNote(e.target.value)}
                            rows={3}
                            placeholder="Nhập giải trình bổ sung hoặc giải đáp yêu cầu của chuyên viên..."
                            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #bfdbfe" }}
                          />
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                              value={supplementUrl.startsWith("data:") ? "[Đã đính kèm ảnh chụp]" : supplementUrl}
                              onChange={e => setSupplementUrl(e.target.value)}
                              placeholder="URL chứng cứ bổ sung (nếu có)"
                              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #bfdbfe" }}
                              readOnly={supplementUrl.startsWith("data:")}
                            />
                            <button
                              type="button"
                              className={styles.uploadBtn}
                              onClick={() => supplementFileInputRef.current?.click()}
                            >
                              Tải ảnh
                            </button>
                            <input
                              ref={supplementFileInputRef}
                              type="file"
                              accept="image/*,.pdf"
                              style={{ display: "none" }}
                              onChange={handleSupplementFile}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "10px", marginTop: 6 }}>
                            <button
                              type="button"
                              className={styles.submit}
                              onClick={() => submitSupplement(t.ticketId)}
                              disabled={submittingSupplement}
                            >
                              {submittingSupplement ? "Đang gửi..." : "Gửi bổ sung"}
                            </button>
                            <button
                              type="button"
                              className={styles.ghost}
                              onClick={() => setSupplementingTicket(null)}
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className={styles.actionRow}>
                        {t.status === "OPEN" || t.status === "UNDER_REVIEW" ? (
                          <>
                            <button
                              type="button"
                              className={styles.ghost}
                              onClick={() => setSupplementingTicket(t.ticketId)}
                            >
                              + Bổ sung chứng cứ đối chất
                            </button>
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              onClick={() => cancelDispute(t.id)}
                            >
                              Rút khiếu nại này
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* TAB 2: PROVIDER REPUTATION (0..100) & HISTORY LEDGER */}
      {activeTab === "reputation" && (
        <div className={styles.reputationWrap}>
          {/* Reputation Card */}
          <div className={styles.reputationCard}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNum}>{reputationScore}</span>
              <span className={styles.scoreMax}>/ 100 điểm</span>
            </div>

            <div className={styles.reputationDetails}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Chỉ số tín nhiệm Provider</h2>
                <span className={`${styles.tierBadge} ${currentTier.cls}`}>
                  {currentTier.label}
                </span>
              </div>
              <p style={{ margin: "4px 0 0 0", color: "var(--wg-text-secondary)", fontSize: "0.9rem" }}>
                Điểm uy tín được tính toán tự động dựa trên chất lượng dịch vụ, thời gian bàn giao và tỷ lệ giải quyết tranh chấp. Quyền nhận việc: <strong>{currentTier.maxOrders}</strong>.
              </p>

              {/* Policy Quick Cards */}
              <div className={styles.policyGrid}>
                <div className={styles.policyItem}>
                  <span>Hoàn thành đơn hàng:</span>
                  <strong style={{ color: "#16a34a" }}>+5 điểm</strong>
                </div>
                <div className={styles.policyItem}>
                  <span>Đánh giá 5 sao:</span>
                  <strong style={{ color: "#16a34a" }}>+2 điểm</strong>
                </div>
                <div className={styles.policyItem}>
                  <span>Trễ hạn n ngày:</span>
                  <strong style={{ color: "#dc2626" }}>-n(n+1)/2 điểm</strong>
                </div>
                <div className={styles.policyItem}>
                  <span>Tự ý bỏ việc:</span>
                  <strong style={{ color: "#dc2626" }}>-50 điểm</strong>
                </div>
                <div className={styles.policyItem}>
                  <span>Lỗi tranh chấp:</span>
                  <strong style={{ color: "#dc2626" }}>-10 điểm</strong>
                </div>
              </div>
            </div>
          </div>

          {/* History Ledger Table */}
          <div className={styles.ledgerCard}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              Sổ cái lịch sử biến động điểm uy tín (Reputation Ledger)
            </h3>
            <p style={{ margin: "4px 0 12px 0", color: "var(--wg-text-secondary)", fontSize: "0.85rem" }}>
              Mỗi biến động điểm đều được ghi vết bất biến kèm mã tham chiếu đơn hàng hoặc quyết định trọng tài.
            </p>

            <table className={styles.ledgerTable}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Sự kiện ghi nhận</th>
                  <th>Mã tham chiếu</th>
                  <th>Biến động</th>
                  <th>Số dư sau</th>
                </tr>
              </thead>
              <tbody>
                {reputationLedger.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.timestamp}</td>
                    <td>
                      <div>{entry.event}</div>
                      {entry.note && (
                        <small style={{ color: "var(--wg-text-secondary)" }}>{entry.note}</small>
                      )}
                    </td>
                    <td>
                      <span className={styles.refBadge}>{entry.referenceId}</span>
                    </td>
                    <td>
                      <span className={entry.delta >= 0 ? styles.deltaPos : styles.deltaNeg}>
                        {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                      </span>
                    </td>
                    <td>
                      <strong>{entry.balance}</strong> / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SANCTIONS CARD & APPEAL FORM */}
      {activeTab === "sanctions" && (
        <div className={styles.sanctionsWrap}>
          {/* Active Sanction Card */}
          <div
            className={`${styles.sanctionCard} ${
              sanctions.length === 0 ? styles.cleanCard : styles.warningCard
            }`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {sanctions.length === 0 ? (
                  <CheckCircle size={28} color="#10b981" />
                ) : (
                  <AlertTriangle size={28} color="#ef4444" />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                    {sanctions.length === 0
                      ? "Trạng thái tài khoản: Trong sạch (Good Standing)"
                      : "Tài khoản đang có chế tài kỷ luật hoạt động"}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", color: "var(--wg-text-secondary)", fontSize: "0.85rem" }}>
                    {sanctions.length === 0
                      ? "Không có án phạt, giới hạn nhận việc hay hạn chế tài khoản nào đang áp dụng."
                      : "Chế tài được ban hành bởi SUPER_ADMIN theo quy chế hoạt động WorkGo."}
                  </p>
                </div>
              </div>
            </div>

            {sanctions.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {sanctions.map(s => (
                  <div key={s.id} style={{ padding: 12, border: "1px solid var(--wg-border)", borderRadius: 10, background: "#fef2f2" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95rem" }}>
                      <span>Mã chế tài: {s.id}</span>
                      <span style={{ color: "#b91c1c" }}>Loại: {s.type} (Phạm vi: {s.scope})</span>
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "0.9rem" }}>Lý do: {s.reason}</p>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Ngày ban hành: {s.issuedAt} {s.expiresAt ? `| Hết hiệu lực: ${s.expiresAt}` : "| Vô thời hạn"} | Người ra lệnh: {s.issuedBy}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sanction Appeal Form */}
          <div className={styles.appealCard}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Scale size={20} color="var(--wg-primary)" /> Đơn kháng nghị chế tài / Phán quyết trọng tài
            </h3>
            <p style={{ margin: "4px 0 16px 0", color: "var(--wg-text-secondary)", fontSize: "0.88rem" }}>
              Nếu bạn nhận thấy phán quyết trọng tài hoặc quyết định chế tài không thỏa đáng, bạn có quyền gửi đơn kháng nghị kèm tài liệu chứng minh để SUPER_ADMIN tái thẩm tra.
            </p>

            <form onSubmit={submitAppeal} noValidate className={styles.form} style={{ marginTop: 0, boxShadow: "none", border: "none", padding: 0 }}>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>Mã chế tài hoặc Mã tranh chấp cần khiếu nại</span>
                  <input
                    value={appealRefId}
                    onChange={e => setAppealRefId(e.target.value)}
                    placeholder="Ví dụ: SNC-001 hoặc DISP-101"
                  />
                </label>
                <label className={styles.field}>
                  <span>Link tài liệu chứng cứ kèm theo</span>
                  <input
                    value={appealEvidence}
                    onChange={e => setAppealEvidence(e.target.value)}
                    placeholder="https://..."
                    inputMode="url"
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Lý do kháng nghị (tối thiểu 20 ký tự)</span>
                <input
                  value={appealReason}
                  onChange={e => setAppealReason(e.target.value)}
                  placeholder="Nhập lý do phản biện chính từ 20 ký tự trở lên..."
                />
              </label>

              <label className={styles.field}>
                <span>Giải trình chi tiết và cam kết khắc phục</span>
                <textarea
                  value={appealExplanation}
                  onChange={e => setAppealExplanation(e.target.value)}
                  rows={4}
                  placeholder="Cung cấp diễn biến thực tế, nguyên nhân khách quan, đối chiếu tin nhắn..."
                />
              </label>

              <button type="submit" className={styles.submit} disabled={submittingAppeal}>
                {submittingAppeal ? "Đang gửi đơn..." : "Gửi đơn kháng nghị tới SUPER_ADMIN"}
              </button>
            </form>

            {/* List of submitted appeals */}
            {submittedAppeals.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>Đơn kháng nghị đã gửi gần đây:</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {submittedAppeals.map(a => (
                    <li key={a.id} style={{ padding: 12, border: "1px solid var(--wg-border)", borderRadius: 8, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                        <span>Đơn #{a.id} (Tham chiếu: {a.sanctionId || "Chế tài"})</span>
                        <span style={{ color: "#d97706" }}>Trạng thái: {a.status}</span>
                      </div>
                      <p style={{ margin: "4px 0", fontSize: "0.88rem" }}>{a.reason}</p>
                      <small style={{ color: "#94a3b8" }}>Ngày gửi: {a.submittedAt}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
