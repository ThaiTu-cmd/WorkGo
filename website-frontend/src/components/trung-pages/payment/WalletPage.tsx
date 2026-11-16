"use client";
// chế độ giả lập

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Wallet } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { KEYS } from "../_stores/keys";
import { mockWallet, type WalletState } from "../_mocks/mockWallet";
import styles from "./WalletPage.module.css";
export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};
export default function WalletPage({
  onNavigate
}: TrungPageProps) {
  const tr = useTranslations("misc");
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
  return <main className={styles.wrap}>
      <h1 className={styles.title}>
        <Wallet size={24} className={styles.titleIcon} aria-hidden="true" />{tr("m1293")}</h1>
      <div style={{
      padding: "10px 14px",
      backgroundColor: "#fef3c7",
      border: "1px solid #fde68a",
      borderRadius: "8px",
      color: "#92400e",
      fontSize: "0.85rem",
      marginBottom: "16px",
      fontWeight: 500
    }}>{tr("m1294")}</div>
      <p className={styles.sub}>{tr("m1295")}</p>
      <div className={styles.walletGrid}>
        <div className={styles.summaryCol}>
          <section className={styles.balance} aria-label={tr("m1290")}>
            <span className={styles.balanceLabel}>{tr("m1296")}</span>
            <strong className={styles.balanceValue}>{wallet.held.toLocaleString("vi-VN")} ₫</strong>
          </section>
          <section className={styles.balance} aria-label={tr("m1291")}>
            <span className={styles.balanceLabel}>{tr("m1297")}</span>
            <strong className={styles.balanceValue}>{wallet.released.toLocaleString("vi-VN")} ₫</strong>
          </section>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onNavigate("payment-gateway")}>{tr("m53")}</button>
            <button type="button" className={styles.ghost} onClick={() => onNavigate("payout-settings")}>{tr("m1283")}</button>
          </div>
        </div>
        <section className={styles.historyCol} aria-label={tr("m1292")}>
          <h2 className={styles.sectionTitle}>{tr("m1292")}</h2>
          {wallet.history.length === 0 ? <p className={styles.empty}>{tr("m1298")}</p> : <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{tr("m1299")}</th>
                    <th scope="col">{tr("m1300")}</th>
                    <th scope="col">{tr("m1301")}</th>
                    <th scope="col">{tr("m1302")}</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet.history.map(h => <tr key={h.id}>
                      <td>{h.label}</td>
                      <td>{h.type}</td>
                      <td>{h.amount.toLocaleString("vi-VN")} ₫</td>
                      <td>{h.at}</td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </section>
      </div>
    </main>;
}