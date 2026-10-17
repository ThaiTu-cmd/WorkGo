"use client";

import { useState } from "react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { mockWallet, type WalletState } from "../_mocks/mockWallet";
import styles from "./WalletPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export default function WalletPage({ onNavigate }: TrungPageProps) {
  const [wallet] = useState<WalletState>(() => {
    if (typeof window === "undefined") return mockWallet;
    try {
      const raw = window.localStorage.getItem(KEYS.wallet);
      if (!raw) return mockWallet;
      const p = JSON.parse(raw) as Partial<WalletState>;
      if (typeof p.held === "number" && typeof p.released === "number" && Array.isArray(p.history)) {
        return p as WalletState;
      }
      return mockWallet;
    } catch {
      return mockWallet;
    }
  });

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>Ví của tôi</h1>
      <p className={styles.sub}>Tiền giữ hộ (escrow) và lịch sử giao dịch của bạn.</p>
      <div className={styles.cards}>
        <section className={styles.balance} aria-label="Tiền đang giữ hộ">
          <span className={styles.balanceLabel}>Đang giữ hộ</span>
          <strong className={styles.balanceValue}>{wallet.held.toLocaleString("vi-VN")} ₫</strong>
        </section>
        <section className={styles.balance} aria-label="Tiền khả dụng">
          <span className={styles.balanceLabel}>Khả dụng</span>
          <strong className={styles.balanceValue}>{wallet.released.toLocaleString("vi-VN")} ₫</strong>
        </section>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => onNavigate("payment-gateway")}>
          Nạp tiền
        </button>
        <button type="button" className={styles.ghost} onClick={() => onNavigate("payout-settings")}>
          Cài đặt rút tiền
        </button>
      </div>
      <h2 className={styles.sectionTitle}>Lịch sử giao dịch</h2>
      {wallet.history.length === 0 ? (
        <p className={styles.empty}>Chưa có giao dịch nào trong ví của bạn.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Giao dịch</th>
                <th scope="col">Loại</th>
                <th scope="col">Số tiền</th>
                <th scope="col">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {wallet.history.map((h) => (
                <tr key={h.id}>
                  <td>{h.label}</td>
                  <td>{h.type}</td>
                  <td>{h.amount.toLocaleString("vi-VN")} ₫</td>
                  <td>{h.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
