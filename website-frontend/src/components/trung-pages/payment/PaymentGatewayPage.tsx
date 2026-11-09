"use client";

// transparency badge: Mock Demo
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { mockWallet, type WalletState } from "../_mocks/mockWallet";
import styles from "./PaymentGatewayPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};
type Tab = "STRIPE" | "VNPAY" | "MOMO";
function loadWallet(): WalletState {
  try {
    const raw = window.localStorage.getItem(KEYS.wallet);
    if (!raw) return mockWallet;
    const p = JSON.parse(raw) as Partial<WalletState>;
    if (typeof p.held !== "number" || typeof p.released !== "number" || !Array.isArray(p.history)) return mockWallet;
    return p as WalletState;
  } catch {
    return mockWallet;
  }
}
export default function PaymentGatewayPage({
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const [tab, setTab] = useState<Tab>("VNPAY");
  const [amountRaw, setAmountRaw] = useState("");
  const [error, setError] = useState("");
  const confirm = () => {
    const amount = Number(String(amountRaw).replace(/[^\d]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(tr("m1265"));
      return;
    }
    if (amount < 50000) {
      setError(tr("m1461", {
        p0: 50000 .toLocaleString("vi-VN")
      }));
      return;
    }
    if (amount > 100000000) {
      setError(tr("m1462", {
        p0: 100000000 .toLocaleString("vi-VN")
      }));
      return;
    }
    setError("");
    try {
      const w = loadWallet();
      window.localStorage.setItem(KEYS.wallet, JSON.stringify({
        held: w.held,
        released: w.released + amount,
        history: [{
          id: `w-${Date.now()}`,
          type: "TOPUP",
          amount,
          label: tr("m1268", {
            p0: tab
          }),
          at: new Date().toISOString().slice(0, 10)
        }, ...w.history]
      } satisfies WalletState));
    } catch {
      onShowToast(tr("m1175"));
      return;
    }
    onShowToast(tr("m1269", {
      p0: amount.toLocaleString("vi-VN"),
      p1: tab
    }));
    onNavigate("wallet");
  };
  return <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <CreditCard size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1272")}</h1>
        <div style={{
        padding: "10px 14px",
        backgroundColor: "#fef3c7",
        border: "1px solid #fde68a",
        borderRadius: "8px",
        color: "#92400e",
        fontSize: "0.85rem",
        marginBottom: "16px",
        fontWeight: 500
      }}>{tr("m1273")}</div>
        <p className={styles.sub}>{tr("m1274")}</p>
        <div className={styles.tabs} role="tablist" aria-label={tr("m488")}>
          {(["STRIPE", "VNPAY", "MOMO"] as const).map(t => <button key={t} type="button" role="tab" aria-selected={tab === t} className={t === tab ? `${styles.tab} ${styles.tabActive}` : styles.tab} onClick={() => setTab(t)}>
              {t === "STRIPE" ? "Stripe" : t === "VNPAY" ? "VNPay" : "Momo"}
            </button>)}
        </div>
        <div className={styles.qr} role="img" aria-label={tr("m1270", {
        p0: tab
      })}>
          <span className={styles.qrText}>{tab} • QR MOCK</span>
          <span className={styles.qrSub}>{tr("m1564")}{tab === "STRIPE" ? "Stripe" : tab === "VNPAY" ? "VNPay" : "Momo"} (demo)</span>
        </div>
        <label className={styles.field} htmlFor="wg-payment-amount">
          <span>{tr("m1276")}</span>
          <input id="wg-payment-amount" value={amountRaw} onChange={e => setAmountRaw(e.target.value)} placeholder="500000" inputMode="numeric" />
        </label>
        {error ? <em className={styles.error}>{error}</em> : null}
        <button type="button" className={styles.submit} onClick={confirm}>{tr("m1277")}</button>
      </div>
    </main>;
}