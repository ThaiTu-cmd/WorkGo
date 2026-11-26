"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  newIdempotencyKey,
  useAuthToken,
  decodeToken,
  MOCK_PAYMENT_ENABLED,
  TOP_UP_MINIMUM_VND
} from "../../webapp-bridge/backend";
import type { TopUpStatus } from "./paymentTypes";
import styles from "./WalletTopUpEmbed.module.css";

export type WalletTopUpEmbedProps = {
  /** The total amount required by the order/checkout flow */
  requiredAmount?: number;
  /** Current available wallet balance of the user */
  currentBalance?: number;
  initialTopUpId?: string;
  onTrackTopUp?: (id?: string) => void;
  /** Callback fired when the server confirms the top-up */
  onSuccess?: () => void;
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

export default function WalletTopUpEmbed(props:WalletTopUpEmbedProps){const token=useAuthToken();return <WalletTopUpContent key={String(decodeToken(token)?.userId??'guest')+':'+(props.initialTopUpId??'')} {...props}/>;}
function WalletTopUpContent({
  requiredAmount = 0,
  currentBalance = 0,
  initialTopUpId,
  onTrackTopUp,
  onSuccess,
  onCancel,
  onNavigate,
  onShowToast,
  embedded = true
}: WalletTopUpEmbedProps) {
  const tr = useTranslations("orderWallet");
  const token = useAuthToken();
  const shortfall = Math.max(0, requiredAmount - currentBalance);

  const initialAmount = Math.max(TOP_UP_MINIMUM_VND, shortfall);
  const storageKey='workgo.topup.pending:'+String(decodeToken(token)?.userId??'');
  const [saved]=useState(()=>{try{const value=JSON.parse(sessionStorage.getItem(storageKey)??'null');return value?.key&&Number.isSafeInteger(value.amount)&&['VNPAY','MOMO','MOCK'].includes(value.gateway)?value:null;}catch{return null;}});
  const [amountRaw, setAmountRaw] = useState(String(saved?.amount??initialAmount));
  const [gateway, setGateway] = useState<GatewayOption>(saved?.gateway??"VNPAY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submission = useRef(false);
  const attempt = useRef<{ amount: number; gateway: GatewayOption; key: string } | null>(saved?{amount:saved.amount,gateway:saved.gateway,key:saved.key}:null);
  const [simulated,setSimulated]=useState(false);

  // Polling state
  const [activeTopUpId, setActiveTopUpId] = useState<string | null>(initialTopUpId || saved?.topUpId || null);
  const [topUpCode, setTopUpCode] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [topUpStatus, setTopUpStatus] = useState<TopUpStatus | null>(initialTopUpId ? 'PENDING' : null);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [pollCount, setPollCount] = useState(0);


  const callbacks = useRef({ onSuccess, onShowToast });
  useEffect(() => { callbacks.current = { onSuccess, onShowToast }; }, [onSuccess, onShowToast]);

  useEffect(() => {
    if (!activeTopUpId || !token) return undefined;
    let stopped = false;
    let count = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const res = await paymentApi.getTopUp(activeTopUpId);
        if (stopped) return;
        const data = (res as { result?: Record<string, unknown> })?.result;
        if (!data?.status) throw new Error(tr('topUpUnavailable'));
        const status = data.status as TopUpStatus;
        if (data.gateway === 'VNPAY' || data.gateway === 'MOMO' || data.gateway === 'MOCK') setGateway(data.gateway);
        setTopUpCode(typeof data.topUpCode === 'string' ? data.topUpCode : null);
        setHostedUrl(data.gateway !== 'MOCK' && typeof data.paymentUrl === 'string' ? data.paymentUrl : null);
        setTopUpStatus(status);
        setSimulated(data.simulated===true||data.currency==='TEST_VND'||data.gateway==='MOCK');
        setError('');
        if (status === 'SUCCEEDED') {
          try{sessionStorage.removeItem(storageKey);}catch{/* receipt remains queryable */}
          if(data.simulated!==true&&data.currency!=='TEST_VND'&&data.gateway!=='MOCK')callbacks.current.onSuccess?.();
          return;
        }
        if (status === 'FAILED') return;
      } catch (err) {
        if (stopped) return;
        setError(paymentErrorMessage(err));
      }
      count += 1;
      setPollCount(count);
      if (count < 15) timer = setTimeout(() => { void check(); }, 2500);
    };
    void check();
    return () => { stopped = true; clearTimeout(timer); };
  }, [activeTopUpId, token, refreshAttempt, tr,storageKey]);
  const handleCreateTopUp = async () => {
    if (submission.current) return;
    const amt = /^\d+$/.test(amountRaw.trim()) ? Number(amountRaw) : NaN;
    if (!Number.isSafeInteger(amt) || amt < TOP_UP_MINIMUM_VND) {
      setError(tr('topUpMinimum', { p0: TOP_UP_MINIMUM_VND.toLocaleString() }));
      return;
    }
    setError("");

    if (!token) {
      if (onShowToast) onShowToast("Vui lòng đăng nhập để nạp ví.");
      if (onNavigate) onNavigate("login");
      return;
    }

    submission.current = true;
    setIsSubmitting(true);
    try {
      if (attempt.current?.amount !== amt || attempt.current.gateway !== gateway) {
        attempt.current = { amount: amt, gateway, key: newIdempotencyKey() };
      }
      try{sessionStorage.setItem(storageKey,JSON.stringify(attempt.current));}catch{/* in-memory key retained */}
      const res = await paymentApi.createTopUp({
        amount: amt,
        gateway,
        paymentMethod: gateway === "MOMO" ? "WALLET" : "QR"
      }, attempt.current.key);

      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      if (typeof data.topUpId !== "string") throw new Error(tr("topUpUnavailable"));
      const topUpId = data.topUpId;
      try{sessionStorage.setItem(storageKey,JSON.stringify({...attempt.current,topUpId}));}catch{/* in-memory key retained */}
      setSimulated(data.simulated===true||data.currency==='TEST_VND'||data.gateway==='MOCK');
      onTrackTopUp?.(topUpId);
      const paymentUrl = data.paymentUrl ? String(data.paymentUrl) : null;
      const initialStatus = (data.status ?? "PENDING") as TopUpStatus;

      setActiveTopUpId(topUpId);
      setTopUpCode(typeof data.topUpCode === "string" ? data.topUpCode : null);
      setHostedUrl(gateway === "MOCK" ? null : paymentUrl);
      setTopUpStatus(initialStatus);
      setPollCount(0);



      if (onShowToast) {
        onShowToast("Đang kết nối cổng thanh toán...");
      }
    } catch (err: unknown) {
      const msg = Number((err as { code?: number })?.code) === 3505 ? tr('topUpLimits') : paymentErrorMessage(err);
      setError(msg);
      if (onShowToast) onShowToast(msg);
    } finally {
      submission.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSimulateMock = async (success: boolean) => {
    if (!activeTopUpId || !topUpCode || gateway !== "MOCK" || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await paymentApi.simulateMockTopUp(topUpCode, success);
      setRefreshAttempt(value => value + 1);
    } catch (err) {
      setError(paymentErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.wrap} ${embedded ? styles.embedded : ""}`}>
      {error && activeTopUpId && <p role="alert">{error}</p>}
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
        topUpStatus === "SUCCEEDED" ? (
          <div className={styles.successBox}>
            <CheckCircle2 size={20} color="#059669" />
            <span>{simulated?'Thử nghiệm TEST_VND — không cộng số dư ví.':'Nạp tiền thành công. Số dư được lấy lại từ server.'}</span>
            {shortfall > 0 && <button type="button" onClick={() => {
              onTrackTopUp?.();
              setActiveTopUpId(null);
              setTopUpStatus(null);
              setAmountRaw(String(Math.max(TOP_UP_MINIMUM_VND, shortfall)));
            }}>{tr('topUpMore')}</button>}
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
                onTrackTopUp?.();
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
            {hostedUrl && <a href={hostedUrl} target="_blank" rel="noopener noreferrer">{tr("openTopUpGateway")}</a>}
            <button type="button" onClick={() => { setPollCount(0); setRefreshAttempt(value => value + 1); }}>{tr('checkTopUp')}</button>
            {MOCK_PAYMENT_ENABLED && gateway === "MOCK" && topUpCode ? (
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
