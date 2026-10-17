"use client";

import { useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { mockPayout, type SavedPayout } from "../_mocks/mockPayout";
import styles from "./PayoutSettingsPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

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

function loadPayout(): SavedPayout {
  if (typeof window === "undefined") return mockPayout;
  try {
    const raw = window.localStorage.getItem(KEYS.payout);
    if (!raw) return mockPayout;
    const p = JSON.parse(raw) as Partial<SavedPayout>;
    return {
      bankName: typeof p.bankName === "string" && p.bankName ? p.bankName : mockPayout.bankName,
      accountName: typeof p.accountName === "string" && p.accountName ? p.accountName : mockPayout.accountName,
      accountNumber: typeof p.accountNumber === "string" && p.accountNumber ? p.accountNumber : mockPayout.accountNumber,
    };
  } catch {
    return mockPayout;
  }
}

export default function PayoutSettingsPage({ onShowToast }: TrungPageProps) {
  const [bankName, setBankName] = useState(() => loadPayout().bankName);
  const [accountName, setAccountName] = useState(() => loadPayout().accountName);
  const [accountNumber, setAccountNumber] = useState(() => loadPayout().accountNumber);
  const [savedMask, setSavedMask] = useState(() => {
    const n = loadPayout().accountNumber;
    return n ? maskAccount(n) : "";
  });
  const [errors, setErrors] = useState<{ bankName?: string; accountName?: string; accountNumber?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBank = sanitizeText(bankName);
    const cleanName = sanitizeText(accountName);
    const digits = sanitizeText(accountNumber).replace(/\D/g, "");
    const next: typeof errors = {};
    if (cleanBank.length < 2) next.bankName = "Vui lòng nhập tên ngân hàng từ 2 ký tự!";
    if (cleanName.length < 2) next.accountName = "Vui lòng nhập tên chủ tài khoản từ 2 ký tự!";
    if (!/^\d{8,19}$/.test(digits)) next.accountNumber = "Số tài khoản phải gồm 8-19 chữ số!";
    setErrors(next);
    if (next.bankName ?? next.accountName ?? next.accountNumber) return;
    try {
      window.localStorage.setItem(
        KEYS.payout,
        JSON.stringify({ bankName: cleanBank, accountName: cleanName, accountNumber: digits }),
      );
    } catch {
      onShowToast("Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.");
      return;
    }
    setSavedMask(maskAccount(digits));
    onShowToast("Đã lưu cài đặt rút tiền!");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cài đặt rút tiền</h1>
        <p className={styles.sub}>Tiền trong ví sẽ được chuyển về tài khoản này khi bạn yêu cầu rút.</p>
        {savedMask ? <p className={styles.saved}>Tài khoản đã lưu: {savedMask}</p> : null}
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Tên ngân hàng</span>
            <input type="text" autoFocus value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Vietcombank" />
            {errors.bankName ? <em className={styles.error}>{errors.bankName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Chủ tài khoản</span>
            <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="NGUYEN VAN A" />
            {errors.accountName ? <em className={styles.error}>{errors.accountName}</em> : null}
          </label>
          <label className={styles.field}>
            <span>Số tài khoản (8-19 số)</span>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" inputMode="numeric" />
            {errors.accountNumber ? <em className={styles.error}>{errors.accountNumber}</em> : null}
          </label>
          <button type="submit" className={styles.submit}>
            Lưu cài đặt
          </button>
        </form>
      </div>
    </main>
  );
}
