"use client";

import { CreditCard, Landmark, Wallet } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import WalletPage from "../payment/WalletPage";
import PaymentGatewayPage from "../payment/PaymentGatewayPage";
import PayoutSettingsPage from "../payment/PayoutSettingsPage";
import styles from "./FinancePage.module.css";

export type FinanceTab = "wallet" | "deposit" | "payout";

const TABS: Array<{ id: FinanceTab; label: string; icon: typeof Wallet }> = [
  { id: "wallet", label: "Ví", icon: Wallet },
  { id: "deposit", label: "Nạp tiền", icon: CreditCard },
  { id: "payout", label: "Rút tiền", icon: Landmark },
];

type FinancePageProps = {
  activeTab?: FinanceTab;
  onOpenTab: (tab: FinanceTab) => void;
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

export default function FinancePage({
  activeTab = "wallet",
  onOpenTab,
  onNavigate,
  onShowToast,
}: FinancePageProps) {
  // Embedded pages keep their own business logic; the three wallet keys they
  // navigate to become in-page tab switches so the user never leaves Finance.
  const navigateWithin = (page: TrungPageKey, params?: CatalogFilterParams) => {
    if (page === "wallet") {
      onOpenTab("wallet");
      return;
    }
    if (page === "payment-gateway") {
      onOpenTab("deposit");
      return;
    }
    if (page === "payout-settings") {
      onOpenTab("payout");
      return;
    }
    onNavigate(page, params);
  };

  // WAI-ARIA tabs: arrow keys / Home / End move selection with focus.
  const onTablistKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onOpenTab(TABS[next].id);
    requestAnimationFrame(() => {
      document.getElementById(`finance-tab-${TABS[next].id}`)?.focus();
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.tabBarWrap}>
        <div
          className={styles.tabBar}
          role="tablist"
          aria-label="Tài chính"
          onKeyDown={onTablistKeyDown}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`finance-tab-${t.id}`}
              aria-selected={activeTab === t.id}
              aria-controls={`finance-panel-${t.id}`}
              tabIndex={activeTab === t.id ? 0 : -1}
              className={activeTab === t.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => onOpenTab(t.id)}
            >
              <t.icon size={16} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Only one panel mounts at a time, so the visible <main> landmark stays single. */}
      <div role="tabpanel" id={`finance-panel-${activeTab}`} aria-labelledby={`finance-tab-${activeTab}`}>
        {activeTab === "wallet" && (
          <WalletPage onNavigate={navigateWithin} onShowToast={onShowToast} />
        )}
        {activeTab === "deposit" && (
          <PaymentGatewayPage onNavigate={navigateWithin} onShowToast={onShowToast} />
        )}
        {activeTab === "payout" && (
          <PayoutSettingsPage onNavigate={navigateWithin} onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
}
