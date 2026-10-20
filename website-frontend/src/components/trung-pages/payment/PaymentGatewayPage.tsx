"use client";

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

export default function PaymentGatewayPage({ onNavigate, onShowToast }: TrungPageProps) {
  const [tab, setTab] = useState<Tab>("VNPAY");
  const [amountRaw, setAmountRaw] = useState("");
  const [error, setError] = useState("");

  const confirm = () => {
    const amount = Number(String(amountRaw).replace(/[^\d]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Số tiền phải là số lớn hơn 0!");
      return;
    }
    if (amount < 50000) {
      setError(`Số tiền tối thiểu là ${(50000).toLocaleString("vi-VN")} ₫!`);
      return;
    }
    if (amount > 100000000) {
      setError(`Số tiền vượt quá ${(100000000).toLocaleString("vi-VN")} ₫ cho phép!`);
      return;
    }
    setError("");
    try {
      const w = loadWallet();
      window.localStorage.setItem(
        KEYS.wallet,
        JSON.stringify({
          held: w.held,
          released: w.released + amount,
          history: [
            { id: `w-${Date.now()}`, type: "TOPUP", amount, label: `Nạp tiền qua ${tab} (mock)`, at: new Date().toISOString().slice(0, 10) },
            ...w.history,
          ],
        } satisfies WalletState),
      );
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    onShowToast(`Đã xác nhận thanh toán ${amount.toLocaleString("vi-VN")} ₫ qua ${tab} (mock)!`);
    onNavigate("wallet");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <CreditCard size={24} className={styles.titleIcon} aria-hidden="true" /> Nạp tiền / Thanh toán
        </h1>
        <p className={styles.sub}>Bản demo giao diện, không kết nối cổng thanh toán thật.</p>
        <div className={styles.tabs} role="tablist" aria-label="Chọn cổng thanh toán">
          {(["STRIPE", "VNPAY", "MOMO"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={t === tab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setTab(t)}
            >
              {t === "STRIPE" ? "Stripe" : t === "VNPAY" ? "VNPay" : "Momo"}
            </button>
          ))}
        </div>
        <div className={styles.qr} role="img" aria-label={`Mã QR ${tab} mô phỏng`}>
          <span className={styles.qrText}>{tab} • QR MOCK</span>
          <span className={styles.qrSub}>Quét mã trong ứng dụng {tab === "STRIPE" ? "Stripe" : tab === "VNPAY" ? "VNPay" : "Momo"} (demo)</span>
        </div>
        <label className={styles.field}>
          <span>Số tiền (₫)</span>
          <input value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)} placeholder="500000" inputMode="numeric" />
        </label>
        {error ? <em className={styles.error}>{error}</em> : null}
        <button type="button" className={styles.submit} onClick={confirm}>
          Xác nhận đã thanh toán (mock)
        </button>
      </div>
    </main>
  );
}
