"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Landmark, ArrowDownToLine, AlertCircle, Loader2 } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { paymentApi, useAuthToken } from "../../webapp-bridge/backend";
import { type SavedPayout } from "./paymentTypes";
import styles from "./PayoutSettingsPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

const POPULAR_BANKS = [
  "Vietcombank",
  "Techcombank",
  "MB Bank",
  "BIDV",
  "VietinBank",
  "ACB",
  "VPBank",
  "TPBank",
  "Sacombank",
  "Agribank"
];

function stripHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function sanitizeText(s: unknown): string {
  return stripHtml(s).replace(/\s+/g, " ").trim();
}

export function maskAccount(n: string): string {
  const digits = n.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

// Validators return a message from the "misc" dictionary, so they take the page's translator.
type Tr = (key: string, values?: Record<string, string | number>) => string;

export function validatePayoutBank(raw: string, tr: Tr): string | undefined {
  return sanitizeText(raw).length < 2 ? tr("m1676") : undefined;
}

export function validatePayoutHolder(raw: string, tr: Tr): string | undefined {
  return sanitizeText(raw).length < 2 ? tr("m1677") : undefined;
}

// Account numbers have 8-19 digits.
export function validatePayoutAccount(raw: string, tr: Tr): string | undefined {
  const digits = sanitizeText(raw).replace(/\D/g, "");
  return /^\d{8,19}$/.test(digits) ? undefined : tr("m1678");
}

function loadLocalPayout(): SavedPayout {
  if (typeof window === "undefined") return { bankName: "", accountName: "", accountNumber: "" };
  try {
    const raw = window.localStorage.getItem(KEYS.payout);
    if (!raw) return { bankName: "", accountName: "", accountNumber: "" };
    const p = JSON.parse(raw) as Partial<SavedPayout>;
    return {
      bankName: typeof p.bankName === "string" ? p.bankName : "",
      accountName: typeof p.accountName === "string" ? p.accountName : "",
      accountNumber: typeof p.accountNumber === "string" ? p.accountNumber : ""
    };
  } catch {
    return { bankName: "", accountName: "", accountNumber: "" };
  }
}

export default function PayoutSettingsPage({
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();

  const [bankName, setBankName] = useState(() => loadLocalPayout().bankName);
  const [accountName, setAccountName] = useState(() => loadLocalPayout().accountName);
  const [accountNumber, setAccountNumber] = useState(() => loadLocalPayout().accountNumber);
  const [savedMask, setSavedMask] = useState(() => {
    const n = loadLocalPayout().accountNumber;
    return n ? maskAccount(n) : "";
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  }>({});

  // Payout request states (Việc 30 / 37)
  const [availableBalance, setAvailableBalance] = useState(0);
  const [hasDebt, setHasDebt] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    // Load saved settings from server
    paymentApi.getPayoutSettings().then(res => {
      if (cancelled) return;
      const data = (res as { result?: SavedPayout })?.result ?? (res as SavedPayout) ?? {};
      if (data.accountNumber) {
        setBankName(data.bankName || "");
        setAccountName(data.accountName || "");
        setAccountNumber(data.accountNumber || "");
        setSavedMask(maskAccount(data.accountNumber));
        try {
          window.localStorage.setItem(KEYS.payout, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    }).catch(() => {
      // Offline fallback: loadLocalPayout already loaded
    });

    // Load wallet balance for withdrawal card
    paymentApi.getWallet().then(res => {
      if (cancelled) return;
      const data = (res as { result?: Record<string, unknown> })?.result ?? res ?? {};
      const avail = Number(data.availableBalance ?? data.available ?? 0);
      const debt = Number(data.debtBalance ?? data.debt ?? 0);
      setAvailableBalance(avail > 0 ? avail : 0);
      setHasDebt(debt > 0);
    }).catch(() => {
      // ignore
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      bankName: validatePayoutBank(bankName, tr),
      accountName: validatePayoutHolder(accountName, tr),
      accountNumber: validatePayoutAccount(accountNumber, tr)
    };
    setErrors(next);
    if (next.bankName ?? next.accountName ?? next.accountNumber) return;

    const cleanBank = sanitizeText(bankName);
    const cleanName = sanitizeText(accountName);
    const digits = sanitizeText(accountNumber).replace(/\D/g, "");

    setIsSaving(true);
    try {
      if (token) {
        await paymentApi.savePayoutSettings({
          bankName: cleanBank,
          accountName: cleanName,
          accountNumber: digits
        });
      }
      window.localStorage.setItem(
        KEYS.payout,
        JSON.stringify({
          bankName: cleanBank,
          accountName: cleanName,
          accountNumber: digits
        })
      );
    } catch {
      onShowToast(tr("m1175"));
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    setSavedMask(maskAccount(digits));
    onShowToast(tr("m1281"));
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(String(withdrawAmount).replace(/[^\d]/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) {
      setWithdrawError("Vui lòng nhập số tiền cần rút hợp lệ.");
      return;
    }
    if (amt < 100000) {
      setWithdrawError("Số tiền rút tối thiểu là 100.000 ₫.");
      return;
    }
    if (amt > availableBalance) {
      setWithdrawError("Số tiền rút không được vượt quá số dư khả dụng hiện có.");
      return;
    }
    if (hasDebt) {
      setWithdrawError("Tài khoản đang có dư nợ. Vui lòng nạp bù trước khi thực hiện rút tiền.");
      return;
    }
    if (!accountNumber) {
      setWithdrawError("Vui lòng lưu thông tin tài khoản ngân hàng trước khi rút tiền.");
      return;
    }
    setWithdrawError("");

    setIsWithdrawing(true);
    try {
      await paymentApi.requestPayout({
        amount: amt,
        bankName,
        accountName,
        accountNumber,
        bankCode: undefined
      });
      setAvailableBalance(prev => Math.max(0, prev - amt));
      setWithdrawAmount("");
      onShowToast(`Đã gửi yêu cầu rút ${amt.toLocaleString("vi-VN")} ₫ thành công!`);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Không thể gửi yêu cầu rút tiền. Vui lòng thử lại.";
      setWithdrawError(msg);
      onShowToast(msg);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            <Landmark size={24} className={styles.titleIcon} aria-hidden="true" />
            {tr("m1283")}
          </h1>
          <div
            style={{
              marginTop: "12px",
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
            Lưu ý: Hệ thống WorkGo giải ngân thu nhập định kỳ qua đối soát ngân hàng. Tiền rút sẽ được chuyển khoản trực tiếp vào số tài khoản thụ hưởng đã xác nhận.
          </div>
          <p className={styles.sub}>{tr("m1284")}</p>
          {savedMask ? (
            <p className={styles.saved}>
              {tr("m1565")} {bankName ? `${bankName} — ` : ""}{savedMask}
            </p>
          ) : null}

          <form onSubmit={submit} noValidate className={styles.form}>
            <label className={styles.field}>
              <span>{tr("m1286")}</span>
              <input
                type="text"
                autoFocus
                value={bankName}
                onChange={e => {
                  setBankName(e.target.value);
                  if (errors.bankName) {
                    setErrors(prev => ({
                      ...prev,
                      bankName: validatePayoutBank(e.target.value, tr)
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    bankName: validatePayoutBank(bankName, tr)
                  }))
                }
                placeholder="Vietcombank"
                aria-invalid={errors.bankName ? true : undefined}
                aria-describedby={errors.bankName ? "payout-bank-error" : undefined}
              />
              <div className={styles.quickBanks}>
                {POPULAR_BANKS.slice(0, 5).map(b => (
                  <button
                    key={b}
                    type="button"
                    className={styles.quickBankBtn}
                    onClick={() => {
                      setBankName(b);
                      if (errors.bankName) setErrors(prev => ({ ...prev, bankName: undefined }));
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {errors.bankName ? (
                <em id="payout-bank-error" className={styles.error}>
                  {errors.bankName}
                </em>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>{tr("m1287")}</span>
              <input
                type="text"
                value={accountName}
                onChange={e => {
                  setAccountName(e.target.value.toUpperCase());
                  if (errors.accountName) {
                    setErrors(prev => ({
                      ...prev,
                      accountName: validatePayoutHolder(e.target.value, tr)
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    accountName: validatePayoutHolder(accountName, tr)
                  }))
                }
                placeholder="NGUYEN VAN A"
                aria-invalid={errors.accountName ? true : undefined}
                aria-describedby={errors.accountName ? "payout-holder-error" : undefined}
              />
              {errors.accountName ? (
                <em id="payout-holder-error" className={styles.error}>
                  {errors.accountName}
                </em>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Số tài khoản</span>
              <input
                type="text"
                value={accountNumber}
                inputMode="numeric"
                onChange={e => {
                  setAccountNumber(e.target.value);
                  if (errors.accountNumber) {
                    setErrors(prev => ({
                      ...prev,
                      accountNumber: validatePayoutAccount(e.target.value, tr)
                    }));
                  }
                }}
                onBlur={() =>
                  setErrors(prev => ({
                    ...prev,
                    accountNumber: validatePayoutAccount(accountNumber, tr)
                  }))
                }
                placeholder="0071001234567"
                aria-invalid={errors.accountNumber ? true : undefined}
                aria-describedby={errors.accountNumber ? "payout-account-error" : undefined}
              />
              {errors.accountNumber ? (
                <em id="payout-account-error" className={styles.error}>
                  {errors.accountNumber}
                </em>
              ) : null}
            </label>

            <button type="submit" className={styles.submit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu cài đặt...
                </>
              ) : (
                "Lưu thông tin ngân hàng"
              )}
            </button>
          </form>
        </div>

        {/* Withdraw Request Section for providers with earnings */}
        {savedMask ? (
          <div className={styles.withdrawCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowDownToLine size={20} color="var(--primary, #1677FF)" />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Yêu cầu rút tiền về ngân hàng
              </h2>
            </div>
            <p className={styles.sub}>
              Rút tiền từ số dư khả dụng về tài khoản thụ hưởng {bankName} ({savedMask}).
            </p>

            <div className={styles.withdrawBalanceBox}>
              <span className={styles.withdrawBalanceLabel}>Số dư khả dụng để rút:</span>
              <span className={styles.withdrawBalanceVal}>
                {availableBalance.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            {hasDebt ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#991b1b",
                  fontSize: "0.85rem",
                  marginBottom: "14px"
                }}
              >
                <AlertCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                Tài khoản đang có dư nợ. Vui lòng nạp bù dư nợ trước khi rút tiền.
              </div>
            ) : null}

            <form onSubmit={handleRequestPayout} className={styles.form} style={{ marginTop: "12px" }}>
              <label className={styles.field}>
                <span>Số tiền muốn rút (tối thiểu 100.000 ₫)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={withdrawAmount}
                  onChange={e => {
                    setWithdrawAmount(e.target.value);
                    if (withdrawError) setWithdrawError("");
                  }}
                  placeholder="Ví dụ: 500000"
                  disabled={availableBalance < 100000 || hasDebt}
                />
                {availableBalance >= 100000 ? (
                  <button
                    type="button"
                    style={{
                      alignSelf: "flex-start",
                      fontSize: "0.8rem",
                      color: "var(--wg-primary, #1677FF)",
                      background: "none",
                      border: "none",
                      padding: "2px 0",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                    onClick={() => setWithdrawAmount(String(availableBalance))}
                  >
                    Rút toàn bộ ({availableBalance.toLocaleString("vi-VN")} ₫)
                  </button>
                ) : null}
              </label>

              {withdrawError ? <em className={styles.error}>{withdrawError}</em> : null}

              <button
                type="submit"
                className={styles.submit}
                disabled={isWithdrawing || availableBalance < 100000 || hasDebt}
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  "Tạo lệnh rút tiền"
                )}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </main>
  );
}
