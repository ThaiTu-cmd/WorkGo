"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
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

export function validatePayoutBank(raw: string): string | undefined {
  return sanitizeText(raw).length < 2 ? "Vui lòng nhập tên ngân hàng từ 2 ký tự!" : undefined;
}

export function validatePayoutHolder(raw: string): string | undefined {
  return sanitizeText(raw).length < 2 ? "Vui lòng nhập tên chủ tài khoản từ 2 ký tự!" : undefined;
}

export function validatePayoutAccount(raw: string): string | undefined {
  const digits = sanitizeText(raw).replace(/\D/g, "");
  return /^\d{8,19}$/.test(digits) ? undefined : "Số tài khoản phải gồm 8-19 chữ số!";
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
    const next: typeof errors = {
      bankName: validatePayoutBank(bankName),
      accountName: validatePayoutHolder(accountName),
      accountNumber: validatePayoutAccount(accountNumber),
    };
    setErrors(next);
    if (next.bankName ?? next.accountName ?? next.accountNumber) return;
    const cleanBank = sanitizeText(bankName);
    const cleanName = sanitizeText(accountName);
    const digits = sanitizeText(accountNumber).replace(/\D/g, "");
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
        <h1 className={styles.title}>
          <Landmark size={24} className={styles.titleIcon} aria-hidden="true" /> Cài đặt rút tiền
        </h1>
        <p className={styles.sub}>Tiền trong ví sẽ được chuyển về tài khoản này khi bạn yêu cầu rút.</p>
        {savedMask ? <p className={styles.saved}>Tài khoản đã lưu: {savedMask}</p> : null}
        <form onSubmit={submit} noValidate className={styles.form}>
          <label className={styles.field}>
            <span>Tên ngân hàng</span>
            <input
              type="text"
              autoFocus
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                if (errors.bankName) setErrors((prev) => ({ ...prev, bankName: validatePayoutBank(e.target.value) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, bankName: validatePayoutBank(bankName) }))}
              placeholder="Vietcombank"
              aria-invalid={errors.bankName ? true : undefined}
              aria-describedby={errors.bankName ? "payout-bank-error" : undefined}
            />
            {errors.bankName ? (
              <em id="payout-bank-error" className={styles.error}>
                {errors.bankName}
              </em>
            ) : null}
          </label>
          <label className={styles.field}>
            <span>Chủ tài khoản</span>
            <input
              type="text"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                if (errors.accountName)
                  setErrors((prev) => ({ ...prev, accountName: validatePayoutHolder(e.target.value) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, accountName: validatePayoutHolder(accountName) }))}
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
            <span>Số tài khoản (8-19 số)</span>
            <input
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                if (errors.accountNumber)
                  setErrors((prev) => ({ ...prev, accountNumber: validatePayoutAccount(e.target.value) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, accountNumber: validatePayoutAccount(accountNumber) }))}
              placeholder="0123456789"
              inputMode="numeric"
              aria-invalid={errors.accountNumber ? true : undefined}
              aria-describedby={errors.accountNumber ? "payout-account-error" : undefined}
            />
            {errors.accountNumber ? (
              <em id="payout-account-error" className={styles.error}>
                {errors.accountNumber}
              </em>
            ) : null}
          </label>
          <button type="submit" className={styles.submit}>
            Lưu cài đặt
          </button>
        </form>
      </div>
    </main>
  );
}
