"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Landmark, ArrowDownToLine, AlertCircle, Loader2 } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { paymentApi, useAuthToken } from "../../webapp-bridge/backend";
import styles from "./PayoutSettingsPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

type Tr = (key: string, values?: Record<string, string | number>) => string;
type Wallet = { balance: number; outstandingFee: number; currency?: string };
type Bank = { bankCode: string; accountName: string; accountNumber: string };
type Payout = { payoutId: string; payoutCode?: string; amount: number; status: string; createdAt: string };
type FieldErrors = { bankName?: string; accountName?: string; accountNumber?: string };

function sanitizeText(value: unknown): string {
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function maskAccount(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length <= 4 ? digits : "****" + digits.slice(-4);
}

export function validatePayoutBank(raw: string, tr: Tr): string | undefined {
  return sanitizeText(raw).length < 2 ? tr("m1676") : undefined;
}

export function validatePayoutHolder(raw: string, tr: Tr): string | undefined {
  return sanitizeText(raw).length < 2 ? tr("m1677") : undefined;
}

// Account numbers have 8-19 digits.
export function validatePayoutAccount(raw: string, tr: Tr): string | undefined {
  return /^\d{8,19}$/.test(sanitizeText(raw)) ? undefined : tr("m1678");
}

export function validatePayoutAmount(amount: number, available: number, debt: number, tr: Tr): string | undefined {
  if (!Number.isSafeInteger(amount) || amount < 50000) return tr("minimum");
  if (amount > 5000000) return tr("dailyLimit");
  if (debt > 0) return tr("hasDebt");
  if (amount > available) return tr("insufficient");
  return undefined;
}

export default function PayoutSettingsPage({ onShowToast }: TrungPageProps) {
  const tr = useTranslations("misc");
  const t = useTranslations("payout");
  const locale = useLocale();
  const token = useAuthToken();
  const [bank, setBank] = useState<Bank>({ bankCode: "", accountName: "", accountNumber: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [loadError, setLoadError] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const initialized = useRef(false);
  const flight = useRef(false);
  const request = useRef<{ payload: string; key: string } | null>(null);
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: "currency", currency: wallet?.currency ?? "VND" }).format(amount);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    Promise.all([paymentApi.getWallet(), paymentApi.getPayouts()])
      .then(([balance, payouts]) => {
        if (!alive) return;
        if (!balance?.result) throw new Error(t("loadFailed"));
        setWallet(balance.result);
        setPayoutHistory(Array.isArray(payouts?.result) ? payouts.result : []);
        setLoadError("");
        if (!initialized.current) {
          initialized.current = true;
          const latest = Array.isArray(payouts?.result) ? payouts.result[0] : null;
          if (latest?.bankCode && latest.accountName && latest.accountNumber) {
            setBank({ bankCode: latest.bankCode, accountName: latest.accountName, accountNumber: latest.accountNumber });
          }
        }
      })
      .catch(() => { if (alive) setLoadError(t("loadFailed")); });
    return () => { alive = false; };
  }, [token, reload, t]);

  const handleRequestPayout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !wallet || loadError || flight.current) return;
    const next = {
      bankName: validatePayoutBank(bank.bankCode, tr),
      accountName: validatePayoutHolder(bank.accountName, tr),
      accountNumber: validatePayoutAccount(bank.accountNumber, tr),
    };
    setErrors(next);
    const amount = Number(amountRaw);
    const payload = {
      amount,
      bankCode: sanitizeText(bank.bankCode),
      accountName: sanitizeText(bank.accountName),
      accountNumber: sanitizeText(bank.accountNumber),
    };
    const fingerprint = JSON.stringify(payload);
    const isReplay = request.current?.payload === fingerprint;
    const amountError = isReplay ? undefined : validatePayoutAmount(amount, wallet.balance, wallet.outstandingFee, t);
    setWithdrawError(amountError ?? "");
    if (next.bankName || next.accountName || next.accountNumber || amountError) return;
    if (request.current?.payload !== fingerprint) request.current = { payload: fingerprint, key: crypto.randomUUID() };
    flight.current = true;
    setBusy(true);
    try {
      const res = await paymentApi.requestPayout(payload, request.current.key);
      if (!res?.result?.payoutId) throw new Error(t("invalidResponse"));
      setAmountRaw("");
      request.current = null;
      onShowToast(t("requested", { p0: res.result.payoutCode ?? res.result.payoutId }));
      // A request creates a held obligation. Only the refreshed wallet determines available funds.
      setWallet(null);
      try {
        const [balance, payouts] = await Promise.all([paymentApi.getWallet(), paymentApi.getPayouts()]);
        if (!balance?.result) throw new Error(t("loadFailed"));
        setWallet(balance.result);
        setPayoutHistory(Array.isArray(payouts?.result) ? payouts.result : []);
      } catch {
        setLoadError(t("loadFailed"));
      }
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? Number(err.code) : null;
      const message = code === 3702 ? t("dailyLimit") : code === 3703 ? t("hasDebt") : code === 3402 ? t("insufficient")
        : err instanceof Error ? err.message : t("requestFailed");
      setWithdrawError(message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}><Landmark size={24} className={styles.titleIcon} aria-hidden="true" />{t("requestTitle")}</h1>
          <p className={styles.sub}>{t("requestDescription")}</p>
          {!token ? <p role="status">{t("signIn")}</p> : <>
            {loadError && <p role="alert" className={styles.error}>{loadError} <button type="button" onClick={() => setReload(value => value + 1)}>{t("reload")}</button></p>}
            {!wallet && !loadError && <p role="status"><Loader2 size={16} />{t("loading")}</p>}
            {wallet && <div className={styles.withdrawBalanceBox}>
              <span className={styles.withdrawBalanceLabel}>{t("available")}</span>
              <span className={styles.withdrawBalanceVal}>{money(wallet.balance)}</span>
            </div>}
            {wallet && wallet.outstandingFee > 0 && <p className={styles.error} role="status"><AlertCircle size={16} />{t("hasDebt")}</p>}
            <form onSubmit={handleRequestPayout} noValidate className={styles.form}>
              <label className={styles.field}>
                <span>{t("bankCode")}</span>
                <input
                  name="bankCode" value={bank.bankCode} autoComplete="off" disabled={busy}
                  onChange={e => setBank({ ...bank, bankCode: e.target.value })}
                  onBlur={() => setErrors(previous => ({ ...previous, bankName: validatePayoutBank(bank.bankCode, tr) }))}
                  aria-invalid={Boolean(errors.bankName)} aria-describedby={errors.bankName ? "payout-bank-error" : undefined}
                />
                {errors.bankName && <em id="payout-bank-error" className={styles.error}>{errors.bankName}</em>}
              </label>
              <label className={styles.field}>
                <span>{t("accountHolder")}</span>
                <input
                  name="accountName" value={bank.accountName} autoComplete="off" disabled={busy}
                  onChange={e => setBank({ ...bank, accountName: e.target.value.toUpperCase() })}
                  onBlur={() => setErrors(previous => ({ ...previous, accountName: validatePayoutHolder(bank.accountName, tr) }))}
                  aria-invalid={Boolean(errors.accountName)} aria-describedby={errors.accountName ? "payout-holder-error" : undefined}
                />
                {errors.accountName && <em id="payout-holder-error" className={styles.error}>{errors.accountName}</em>}
              </label>
              <label className={styles.field}>
                <span>{t("accountNumber")}</span>
                <input
                  name="accountNumber" value={bank.accountNumber} inputMode="numeric" autoComplete="off" disabled={busy}
                  onChange={e => setBank({ ...bank, accountNumber: e.target.value })}
                  onBlur={() => setErrors(previous => ({ ...previous, accountNumber: validatePayoutAccount(bank.accountNumber, tr) }))}
                  aria-invalid={Boolean(errors.accountNumber)} aria-describedby={errors.accountNumber ? "payout-account-error" : undefined}
                />
                {errors.accountNumber && <em id="payout-account-error" className={styles.error}>{errors.accountNumber}</em>}
              </label>
              <label className={styles.field}>
                <span>{t("amountLabel")}</span>
                <input name="amount" inputMode="numeric" value={amountRaw} onChange={e => setAmountRaw(e.target.value)} disabled={busy} aria-describedby="payout-limits" />
                <span id="payout-limits" className={styles.sub}>{t("limits")}</span>
              </label>
              {withdrawError && <p role="alert" className={styles.error}>{withdrawError}</p>}
              <button type="submit" className={styles.submit} disabled={busy || !wallet || Boolean(loadError)}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                {t(busy ? "requesting" : "request")}
              </button>
            </form>
          </>}
        </div>
        {token && !loadError && <div className={styles.card}>
          <h2>{t("historyTitle")}</h2>
          {!wallet ? <p className={styles.sub}>{t("loading")}</p> : payoutHistory.length === 0 ? (
            <p className={styles.sub}>{t("historyEmpty")}</p>
          ) : <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr>
                <th>{t("historyCode")}</th>
                <th>{t("historyAmount")}</th>
                <th>{t("historyStatus")}</th>
                <th>{t("historyDate")}</th>
              </tr></thead>
              <tbody>{payoutHistory.map(payout => <tr key={payout.payoutId}>
                <td>{payout.payoutCode ?? payout.payoutId}</td>
                <td>{money(payout.amount)}</td>
                <td>{payout.status}</td>
                <td>{payout.createdAt?.slice(0, 10)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        </div>}
      </div>
    </main>
  );
}
