"use client";

// transparency badge: Mock Demo
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Wallet
} from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import {
  paymentApi,
  paymentErrorMessage,
  useAuthToken,
  MOCK_PAYMENT_ENABLED
} from "../../webapp-bridge/backend";
import type { TopUpStatus } from "./paymentTypes";
import styles from "./PaymentGatewayPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
  params?: CatalogFilterParams;
};

type Tab = "STRIPE" | "VNPAY" | "MOMO" | "MOCK";

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function PaymentGatewayPage({
  onNavigate,
  onShowToast,
  params
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [tab, setTab] = useState<Tab>("VNPAY");
  const [amountRaw, setAmountRaw] = useState(() => {
    if (params?.amount && Number(params.amount) > 0) return String(params.amount);
    if (typeof window !== "undefined") {
      const qAmount = new URLSearchParams(window.location.search).get("amount");
      if (qAmount && Number(qAmount) > 0) return qAmount;
    }
    return "500000";
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debt & Wallet balance state
  const [debtAmount, setDebtAmount] = useState(0);

  // Active top-up transaction tracking & UNKNOWN polling
  const [activeTopUpId, setActiveTopUpId] = useState<string | null>(() => {
    if (params?.topUpId) return params.topUpId;
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("topUpId") || null;
    }
    return null;
  });
  const [topUpStatus, setTopUpStatus] = useState<TopUpStatus | null>(() => {
    if (params?.topUpId) return "PENDING";
    if (typeof window !== "undefined") {
      const qTopUpId = new URLSearchParams(window.location.search).get("topUpId");
      if (qTopUpId) return "PENDING";
    }
    return null;
  });
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [pollCount, setPollCount] = useState<number>(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollStatusRef = useRef<(id: string) => Promise<void>>(async () => {});

  // Check current debt on mount if logged in
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    paymentApi.getWallet().then(res => {
      if (cancelled) return;
      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      const debt = Number(data.debtBalance ?? data.debt ?? 0);
      if (debt > 0) {
        setDebtAmount(debt);
        setAmountRaw(String(debt));
      }
    }).catch(() => {
      // Ignore wallet fetch error in guest mode
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Poll top-up transaction status (handles INITIATED, PENDING, and UNKNOWN)
  const pollStatus = useCallback(async (topUpId: string) => {
    try {
      const res = await paymentApi.getTopUp(topUpId);
      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      const status = (data.status ?? "UNKNOWN") as TopUpStatus;
      setTopUpStatus(status);
      if (data.amount) {
        setTopUpAmount(Number(data.amount));
      }

      // Terminal states stop polling
      if (status === "SUCCESS") {
        onShowToast(`Nạp tiền thành công! Đã cộng ${Number(data.amount ?? topUpAmount).toLocaleString("vi-VN")} ₫ vào ví.`);
        return;
      }
      if (status === "FAILED") {
        onShowToast("Giao dịch nạp tiền thất bại hoặc bị từ chối.");
        return;
      }

      // Continue polling if still INITIATED, PENDING, or UNKNOWN (max 20 attempts)
      setPollCount(prev => {
        const next = prev + 1;
        if (next < 20) {
          pollTimerRef.current = setTimeout(() => {
            void pollStatusRef.current(topUpId);
          }, 2500);
        } else if (status === "UNKNOWN") {
          // Reached timeout while UNKNOWN: explain reconciliation guarantee
          onShowToast("Giao dịch đang được đối soát tự động với ngân hàng. Số dư ví sẽ được cập nhật sớm.");
        }
        return next;
      });
    } catch {
      // Network hiccup during polling: treat as UNKNOWN and retry
      setPollCount(prev => {
        const next = prev + 1;
        if (next < 20) {
          pollTimerRef.current = setTimeout(() => {
            void pollStatusRef.current(topUpId);
          }, 3000);
        }
        return next;
      });
    }
  }, [topUpAmount, onShowToast]);

  useEffect(() => {
    pollStatusRef.current = pollStatus;
  }, [pollStatus]);

  useEffect(() => {
    if (activeTopUpId && (topUpStatus === "PENDING" || topUpStatus === "INITIATED" || topUpStatus === "UNKNOWN")) {
      const timer = setTimeout(() => {
        void pollStatusRef.current(activeTopUpId);
      }, 0);
      return () => {
        clearTimeout(timer);
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      };
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [activeTopUpId, topUpStatus]);

  const handlePresetSelect = (val: number) => {
    setAmountRaw(String(val));
    setError("");
  };

  const confirm = async () => {
    const amount = Number(String(amountRaw).replace(/[^\d]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(tr("m1265"));
      return;
    }
    if (amount < 50000) {
      setError(
        tr("m1461", {
          p0: (50000).toLocaleString("vi-VN")
        })
      );
      return;
    }
    if (amount > 100000000) {
      setError(
        tr("m1462", {
          p0: (100000000).toLocaleString("vi-VN")
        })
      );
      return;
    }
    setError("");

    if (!token) {
      onShowToast("Vui lòng đăng nhập để thực hiện nạp tiền vào ví.");
      onNavigate("login");
      return;
    }

    setIsSubmitting(true);
    setTopUpAmount(amount);

    try {
      const gateway = tab === "STRIPE" ? "VNPAY" : tab;
      const paymentMethod = tab === "MOMO" ? "WALLET" : "QR";

      const res = await paymentApi.createTopUp({
        amount,
        gateway,
        paymentMethod
      });

      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      const topUpId = String(data.topUpId ?? data.id ?? `top-${Date.now()}`);
      const paymentUrl = data.paymentUrl ? String(data.paymentUrl) : null;
      const initialStatus = (data.status ?? "PENDING") as TopUpStatus;

      setActiveTopUpId(topUpId);
      setTopUpStatus(initialStatus);
      setPollCount(0);

      // In real mode with hosted paymentUrl (VNPay / MoMo)
      if (gateway !== "MOCK" && paymentUrl && typeof window !== "undefined") {
        window.location.assign(paymentUrl);
        return;
      }

      onShowToast("Yêu cầu nạp tiền đã được khởi tạo. Đang xử lý giao dịch...");
    } catch (err: unknown) {
      const msg = paymentErrorMessage(err);
      setError(msg);
      onShowToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateMock = async (success: boolean) => {
    if (!activeTopUpId) return;
    setIsSubmitting(true);
    try {
      await paymentApi.simulateMockPayment(activeTopUpId, success);
      setTopUpStatus(success ? "SUCCESS" : "FAILED");
      onShowToast(success ? "Giả lập thanh toán thành công!" : "Giả lập thanh toán thất bại.");
    } catch {
      // Mock gateway endpoint not available in production, set local status
      setTopUpStatus(success ? "SUCCESS" : "FAILED");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setActiveTopUpId(null);
    setTopUpStatus(null);
    setPollCount(0);
    setError("");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <CreditCard size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1272")}
        </h1>

        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--warning-bg, #fef3c7)",
            border: "1px solid var(--border-default, #fde68a)",
            borderRadius: "8px",
            color: "var(--text-primary, #92400e)",
            fontSize: "0.85rem",
            fontWeight: 500,
            lineHeight: 1.5
          }}
        >
          <strong>{tr("m1273")}</strong>: Cổng thanh toán nạp tiền ví WorkGo tích hợp VNPay và MoMo theo quy chuẩn bảo mật liên ngân hàng. Tiền nạp sẽ được cộng trực tiếp vào số dư khả dụng và có thể sử dụng ngay để đặt dịch vụ hoặc bù dư nợ.
        </div>

        {debtAmount > 0 ? (
          <div className={styles.debtBanner} role="alert">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Tài khoản đang có dư nợ: {debtAmount.toLocaleString("vi-VN")} ₫</strong>
              <div style={{ fontSize: "0.82rem", marginTop: "2px" }}>
                Số tiền này cần nạp bù để tiếp tục nhận việc hoặc tạo đơn mới.
              </div>
            </div>
          </div>
        ) : null}

        {/* Status view during or after transaction */}
        {activeTopUpId && topUpStatus ? (
          <div
            className={`${styles.statusCard} ${
              topUpStatus === "SUCCESS"
                ? styles.statusSuccess
                : topUpStatus === "FAILED"
                ? styles.statusFailed
                : topUpStatus === "UNKNOWN"
                ? styles.statusUnknown
                : styles.statusPending
            }`}
          >
            {topUpStatus === "PENDING" || topUpStatus === "INITIATED" ? (
              <>
                <Loader2 size={36} color="var(--primary, #1677FF)" className="animate-spin" />
                <h2 className={styles.statusTitle}>Đang xử lý giao dịch nạp tiền</h2>
                <p className={styles.statusDesc}>
                  Hệ thống đang kết nối với cổng thanh toán {tab}. Vui lòng không đóng trình duyệt trong khi giao dịch đang được thực hiện (Lần kiểm tra: {pollCount + 1}/20).
                </p>
                {MOCK_PAYMENT_ENABLED || tab === "MOCK" ? (
                  <div className={styles.statusActions}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleSimulateMock(true)}
                      disabled={isSubmitting}
                    >
                      Giả lập nạp thành công (Dev)
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleSimulateMock(false)}
                      disabled={isSubmitting}
                    >
                      Giả lập thất bại
                    </button>
                  </div>
                ) : null}
              </>
            ) : topUpStatus === "UNKNOWN" ? (
              <>
                <AlertTriangle size={36} color="#d97706" />
                <h2 className={styles.statusTitle} style={{ color: "#92400e" }}>
                  Giao dịch đang chờ đối soát (UNKNOWN)
                </h2>
                <p className={styles.statusDesc} style={{ color: "#78350f" }}>
                  Kết quả giao dịch từ cổng thanh toán chưa được xác nhận hoàn tất. Hệ thống WorkGo đang tự động đối soát với ngân hàng để bảo đảm không trừ tiền 2 lần. Số dư ví sẽ được cập nhật tự động ngay khi nhận được xác nhận từ phía đối tác.
                </p>
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => pollStatus(activeTopUpId)}
                  >
                    <RefreshCw size={14} style={{ marginRight: "4px" }} />
                    Kiểm tra lại trạng thái
                  </button>
                  <button
                    type="button"
                    className={styles.submit}
                    onClick={() => onNavigate("wallet")}
                  >
                    <Wallet size={16} />
                    Quay lại ví
                  </button>
                </div>
              </>
            ) : topUpStatus === "SUCCESS" ? (
              <>
                <CheckCircle2 size={36} color="#059669" />
                <h2 className={styles.statusTitle} style={{ color: "#065f46" }}>
                  Nạp tiền thành công!
                </h2>
                <p className={styles.statusDesc} style={{ color: "#047857" }}>
                  Đã nạp thành công{" "}
                  <strong>{topUpAmount.toLocaleString("vi-VN")} ₫</strong> vào ví WorkGo của bạn.
                </p>
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={styles.submit}
                    onClick={() => onNavigate("wallet")}
                  >
                    <Wallet size={16} />
                    Vào xem số dư ví
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={resetForm}
                  >
                    Nạp tiếp
                  </button>
                </div>
              </>
            ) : (
              <>
                <XCircle size={36} color="#dc2626" />
                <h2 className={styles.statusTitle} style={{ color: "#991b1b" }}>
                  Giao dịch không thành công
                </h2>
                <p className={styles.statusDesc} style={{ color: "#7f1d1d" }}>
                  Giao dịch nạp tiền đã bị hủy hoặc không nhận được xác nhận thanh toán hợp lệ.
                </p>
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={styles.submit}
                    onClick={resetForm}
                  >
                    Thử nạp lại
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => onNavigate("wallet")}
                  >
                    Về trang ví
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Main Top-up Form */
          <>
            <p className={styles.sub}>{tr("m1274")}</p>

            <div className={styles.tabs} role="tablist" aria-label={tr("m488")}>
              {(
                [
                  { id: "VNPAY", label: "VNPay (QR/ATM)" },
                  { id: "MOMO", label: "Ví MoMo" },
                  ...(MOCK_PAYMENT_ENABLED ? [{ id: "MOCK", label: "Cổng Thử Nghiệm (Mock)" }] : [])
                ] as const
              ).map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={t.id === tab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                  onClick={() => setTab(t.id as Tab)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              style={{
                margin: "12px 0",
                padding: "16px",
                borderRadius: "12px",
                border: "1px dashed var(--border-default, #cbd5e1)",
                textAlign: "center",
                backgroundColor: "var(--surface-subtle, #f8fafc)"
              }}
            >
              <ShieldCheck size={32} color="var(--primary, #1677FF)" style={{ marginBottom: "6px" }} />
              <p style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", marginBottom: "2px" }}>
                Thanh toán bảo mật qua {tab === "VNPAY" ? "VNPay" : tab === "MOMO" ? "MoMo" : "Cổng Sandbox"}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted, #64748b)", margin: 0 }}>
                Hỗ trợ quét mã QR, thẻ ATM nội địa 40+ ngân hàng và thẻ quốc tế Visa/Mastercard.
              </p>
            </div>

            <div className={styles.field}>
              <span>Chọn nhanh số tiền nạp:</span>
              <div className={styles.chips}>
                {debtAmount > 0 ? (
                  <button
                    type="button"
                    className={`${styles.chip} ${styles.chipDebt} ${
                      amountRaw === String(debtAmount) ? styles.chipActive : ""
                    }`}
                    onClick={() => handlePresetSelect(debtAmount)}
                  >
                    Nạp bù dư nợ: {debtAmount.toLocaleString("vi-VN")} ₫
                  </button>
                ) : null}
                {PRESET_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className={`${styles.chip} ${
                      amountRaw === String(amt) ? styles.chipActive : ""
                    }`}
                    onClick={() => handlePresetSelect(amt)}
                  >
                    {amt.toLocaleString("vi-VN")} ₫
                  </button>
                ))}
              </div>
            </div>

            <label className={styles.field} htmlFor="wg-payment-amount">
              <span>{tr("m1276")} (VND)</span>
              <input
                id="wg-payment-amount"
                value={amountRaw}
                onChange={e => {
                  setAmountRaw(e.target.value);
                  if (error) setError("");
                }}
                placeholder="500000"
                inputMode="numeric"
              />
            </label>

            {error ? <em className={styles.error}>{error}</em> : null}

            <button
              type="button"
              className={styles.submit}
              onClick={confirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang khởi tạo giao dịch...
                </>
              ) : (
                <>
                  {debtAmount > 0 && amountRaw === String(debtAmount)
                    ? `Nạp bù nợ ${Number(amountRaw).toLocaleString("vi-VN")} ₫`
                    : `${tr("m1277")} ${
                        Number(amountRaw) > 0 ? `${Number(amountRaw).toLocaleString("vi-VN")} ₫` : ""
                      }`}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
