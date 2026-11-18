"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wallet,
  CheckCircle2,
  Loader2,
  ArrowRight,
  PlusCircle
} from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import {
  paymentApi,
  paymentErrorMessage,
  useAuthToken,
  MOCK_PAYMENT_ENABLED
} from "../../webapp-bridge/backend";
import type { TopUpStatus } from "./paymentTypes";
import styles from "./WalletTopUpEmbed.module.css";

export type WalletTopUpEmbedProps = {
  /** The total amount required by the order/checkout flow */
  requiredAmount?: number;
  /** Current available wallet balance of the user */
  currentBalance?: number;
  /** Callback fired with the new available balance when top-up succeeds */
  onSuccess?: (newBalance: number) => void;
  /** Callback fired when user cancels top-up */
  onCancel?: () => void;
  /** Navigation handler to other Trung pages */
  onNavigate?: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  /** Toast notification handler */
  onShowToast?: (message: string) => void;
  /** Whether the component is rendered embedded inside checkout */
  embedded?: boolean;
};

type GatewayOption = "VNPAY" | "MOMO" | "MOCK";

export default function WalletTopUpEmbed({
  requiredAmount = 0,
  currentBalance = 0,
  onSuccess,
  onCancel,
  onNavigate,
  onShowToast,
  embedded = true
}: WalletTopUpEmbedProps) {
  const token = useAuthToken();
  const shortfall = Math.max(0, requiredAmount - currentBalance);

  // Default to shortfall if > 50,000, else default to 100,000
  const initialAmount = shortfall >= 50000 ? shortfall : Math.max(50000, shortfall);
  const [amountRaw, setAmountRaw] = useState(String(initialAmount));
  const [gateway, setGateway] = useState<GatewayOption>("VNPAY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Polling state
  const [activeTopUpId, setActiveTopUpId] = useState<string | null>(null);
  const [topUpStatus, setTopUpStatus] = useState<TopUpStatus | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTopUpRef = useRef<(id: string) => Promise<void>>(async () => {});

  // Poll transaction status
  const pollTopUp = useCallback(async (topUpId: string) => {
    try {
      const res = await paymentApi.getTopUp(topUpId);
      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      const status = (data.status ?? "UNKNOWN") as TopUpStatus;
      setTopUpStatus(status);

      if (status === "SUCCESS") {
        const added = Number(data.amount ?? amountRaw);
        const nextBalance = currentBalance + added;
        if (onShowToast) {
          onShowToast(`Nạp ví thành công! Đã cộng ${added.toLocaleString("vi-VN")} ₫.`);
        }
        if (onSuccess) {
          onSuccess(nextBalance);
        }
        return;
      }

      if (status === "FAILED") {
        if (onShowToast) {
          onShowToast("Giao dịch nạp tiền thất bại hoặc bị hủy.");
        }
        return;
      }

      // Continue polling if INITIATED, PENDING, or UNKNOWN
      setPollCount(prev => {
        const next = prev + 1;
        if (next < 15) {
          pollTimerRef.current = setTimeout(() => {
            void pollTopUpRef.current(topUpId);
          }, 2500);
        } else if (status === "UNKNOWN" && onShowToast) {
          onShowToast("Giao dịch đang được đối soát tự động. Số dư ví sẽ được cập nhật sớm.");
        }
        return next;
      });
    } catch {
      setPollCount(prev => {
        const next = prev + 1;
        if (next < 15) {
          pollTimerRef.current = setTimeout(() => {
            void pollTopUpRef.current(topUpId);
          }, 3000);
        }
        return next;
      });
    }
  }, [amountRaw, currentBalance, onSuccess, onShowToast]);

  useEffect(() => {
    pollTopUpRef.current = pollTopUp;
  }, [pollTopUp]);

  useEffect(() => {
    if (activeTopUpId && (topUpStatus === "PENDING" || topUpStatus === "INITIATED" || topUpStatus === "UNKNOWN")) {
      const timer = setTimeout(() => {
        void pollTopUpRef.current(activeTopUpId);
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

  const handleCreateTopUp = async () => {
    const amt = Number(String(amountRaw).replace(/[^\d]/g, ""));
    if (!Number.isFinite(amt) || amt < 50000) {
      setError("Số tiền nạp tối thiểu là 50.000 ₫.");
      return;
    }
    if (amt > 100000000) {
      setError("Số tiền nạp tối đa là 100.000.000 ₫.");
      return;
    }
    setError("");

    if (!token) {
      if (onShowToast) onShowToast("Vui lòng đăng nhập để nạp ví.");
      if (onNavigate) onNavigate("login");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await paymentApi.createTopUp({
        amount: amt,
        gateway,
        paymentMethod: gateway === "MOMO" ? "WALLET" : "QR"
      });

      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      const topUpId = String(data.topUpId ?? data.id ?? `top-${Date.now()}`);
      const paymentUrl = data.paymentUrl ? String(data.paymentUrl) : null;
      const initialStatus = (data.status ?? "PENDING") as TopUpStatus;

      setActiveTopUpId(topUpId);
      setTopUpStatus(initialStatus);
      setPollCount(0);

      // In real gateway mode (VNPay/MoMo with hosted URL): redirect
      if (gateway !== "MOCK" && paymentUrl && typeof window !== "undefined") {
        window.location.assign(paymentUrl);
        return;
      }

      if (onShowToast) {
        onShowToast("Đang kết nối cổng thanh toán...");
      }
    } catch (err: unknown) {
      const msg = paymentErrorMessage(err);
      setError(msg);
      if (onShowToast) onShowToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateMock = async (success: boolean) => {
    if (!activeTopUpId) return;
    setIsSubmitting(true);
    try {
      await paymentApi.simulateMockPayment(activeTopUpId, success);
    } catch {
      // ignore
    }
    setTopUpStatus(success ? "SUCCESS" : "FAILED");
    if (success && onSuccess) {
      const amt = Number(amountRaw);
      onSuccess(currentBalance + amt);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`${styles.wrap} ${embedded ? styles.embedded : ""}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Wallet size={18} color="var(--primary, #1677FF)" />
          Nạp tiền ví để thanh toán đơn hàng
        </h3>
        {onCancel ? (
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--wg-text-secondary)",
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
            onClick={onCancel}
          >
            Đóng
          </button>
        ) : null}
      </div>

      <div className={styles.balanceGrid}>
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>Số dư khả dụng</span>
          <span className={styles.balanceVal}>
            {currentBalance.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>Tổng đơn hàng</span>
          <span className={styles.balanceVal}>
            {requiredAmount.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        <div className={styles.balanceItem}>
          <span className={styles.balanceLabel}>Số tiền cần nạp thêm</span>
          <span className={`${styles.balanceVal} ${styles.balanceShortfall}`}>
            {shortfall.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      </div>

      {/* Transaction status card */}
      {activeTopUpId && topUpStatus ? (
        topUpStatus === "SUCCESS" ? (
          <div className={styles.successBox}>
            <CheckCircle2 size={20} color="#059669" />
            <span>Nạp tiền thành công! Bạn có thể tiếp tục thanh toán đơn hàng.</span>
          </div>
        ) : topUpStatus === "FAILED" ? (
          <div
            style={{
              padding: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "0.85rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>Giao dịch nạp tiền thất bại hoặc bị hủy.</span>
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                setActiveTopUpId(null);
                setTopUpStatus(null);
              }}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className={styles.pollingBox}>
            <Loader2 size={28} color="var(--primary, #1677FF)" className="animate-spin" />
            <h4 className={styles.pollingTitle}>
              {topUpStatus === "UNKNOWN"
                ? "Giao dịch đang chờ đối soát (UNKNOWN)"
                : `Đang xử lý nạp tiền qua ${gateway}`}
            </h4>
            <p className={styles.pollingText}>
              {topUpStatus === "UNKNOWN"
                ? "Hệ thống đang tự động kiểm tra trạng thái xác nhận từ ngân hàng..."
                : `Vui lòng hoàn tất thanh toán trên cổng ${gateway}. Hệ thống đang kiểm tra kết quả (${pollCount + 1}/15)...`}
            </p>
            {MOCK_PAYMENT_ENABLED || gateway === "MOCK" ? (
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSimulateMock(true)}
                  disabled={isSubmitting}
                >
                  Giả lập nạp thành công (Dev)
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSimulateMock(false)}
                  disabled={isSubmitting}
                >
                  Giả lập thất bại
                </button>
              </div>
            ) : null}
          </div>
        )
      ) : (
        /* Top-up Selection & Creation */
        <>
          <div className={styles.gateways}>
            <button
              type="button"
              className={`${styles.gatewayBtn} ${gateway === "VNPAY" ? styles.gatewayBtnActive : ""}`}
              onClick={() => setGateway("VNPAY")}
            >
              VNPay (QR/ATM)
            </button>
            <button
              type="button"
              className={`${styles.gatewayBtn} ${gateway === "MOMO" ? styles.gatewayBtnActive : ""}`}
              onClick={() => setGateway("MOMO")}
            >
              Ví MoMo
            </button>
            {MOCK_PAYMENT_ENABLED ? (
              <button
                type="button"
                className={`${styles.gatewayBtn} ${gateway === "MOCK" ? styles.gatewayBtnActive : ""}`}
                onClick={() => setGateway("MOCK")}
              >
                Cổng Test
              </button>
            ) : null}
          </div>

          <div className={styles.chips}>
            {shortfall > 0 ? (
              <button
                type="button"
                className={`${styles.chip} ${styles.chipShortfall} ${
                  amountRaw === String(shortfall) ? styles.chipShortfallActive : ""
                }`}
                onClick={() => setAmountRaw(String(shortfall))}
              >
                Nạp đúng số thiếu: {shortfall.toLocaleString("vi-VN")} ₫
              </button>
            ) : null}
            {[100000, 200000, 500000, 1000000].map(amt => (
              <button
                key={amt}
                type="button"
                className={`${styles.chip} ${amountRaw === String(amt) ? styles.chipActive : ""}`}
                onClick={() => setAmountRaw(String(amt))}
              >
                +{amt.toLocaleString("vi-VN")} ₫
              </button>
            ))}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="embed-topup-amount">
              Số tiền nạp (VND)
            </label>
            <input
              id="embed-topup-amount"
              className={styles.inputField}
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={e => {
                setAmountRaw(e.target.value);
                if (error) setError("");
              }}
              placeholder="500000"
            />
          </div>

          {error ? <span className={styles.error}>{error}</span> : null}

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleCreateTopUp}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang khởi tạo...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Nạp {Number(amountRaw) > 0 ? `${Number(amountRaw).toLocaleString("vi-VN")} ₫` : ""} ngay
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
