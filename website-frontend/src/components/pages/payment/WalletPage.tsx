"use client";

// transparency badge: chế độ giả lập
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Landmark,
  LogIn
} from "lucide-react";
import type { CatalogFilterParams, PageKey } from "../../shell/MarketplaceShell";
import { paymentApi, useAuthToken } from "../../shell/backend";
import type { WalletEntry, WalletState, WalletEntryType } from "./paymentTypes";
import styles from "./WalletPage.module.css";
import { walletHistory } from './walletHistory';

export type PageProps = {
  onNavigate: (page: PageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

type FilterType = "ALL" | WalletEntryType;

const parseWalletResponse = (res: unknown): { available: number; held: number; debt: number; currency: string } => {
  const r = res as { result?: Record<string, unknown> } & Record<string, unknown>;
  const data = r?.result ?? r ?? {};
  const available = Number(data.balance ?? 0);
  const held = Number(data.heldBalance ?? data.held ?? 0);
  const debt = Number(data.outstandingFee ?? 0);
  const currency = String(data.currency ?? "VND");
  return {
    available: Number.isFinite(available) ? available : 0,
    held: Number.isFinite(held) ? held : 0,
    debt: Number.isFinite(debt) ? debt : 0,
    currency
  };
};

const getBadgeClass = (type: WalletEntryType) => {
  switch (type) {
    case "TOPUP":
      return `${styles.badge} ${styles.badgeTopup}`;
    case "HOLD":
      return `${styles.badge} ${styles.badgeHold}`;
    case "RELEASE":
      return `${styles.badge} ${styles.badgeRelease}`;
    case "REFUND":
      return `${styles.badge} ${styles.badgeRefund}`;
    case "FEE_DEBT":
      return `${styles.badge} ${styles.badgeDebt}`;
    case "PAYOUT":
      return `${styles.badge} ${styles.badgePayout}`;
    default:
      return `${styles.badge} ${styles.badgeAdjustment}`;
  }
};

const getTypeLabel = (type: WalletEntryType): string => {
  switch (type) {
    case "TOPUP":
      return "Nạp tiền";
    case "HOLD":
      return "Ký quỹ";
    case "RELEASE":
      return "Giải ngân";
    case "REFUND":
      return "Hoàn tiền";
    case "FEE_DEBT":
      return "Nợ phí";
    case "PAYOUT":
      return "Rút tiền";
    default:
      return "Bút toán";
  }
};

export default function WalletPage({
  onNavigate
}: PageProps) {
  const tr = useTranslations("misc");
  const historyTr = useTranslations('walletHistory');
  const token = useAuthToken();
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [wallet, setWallet] = useState<WalletState>({
    available: 0,
    held: 0,
    debt: 0,
    currency: "VND",
    history: []
  });

  const loadData = useCallback(async (manual = false) => {
    if (!token) return;
    if (manual) setIsLoading(true);
    try {
      const [walletRes, topUpsRes, payoutsRes, feesRes] = await Promise.all([
        paymentApi.getWallet(),
        paymentApi.getTopUps(),
        paymentApi.getPayouts(),
        paymentApi.getFees(),
      ]);
      const wData = parseWalletResponse(walletRes);
      const records = walletHistory(topUpsRes?.result ?? [], payoutsRes?.result ?? [], feesRes?.result ?? []);
      const entries: WalletEntry[] = records.map(row => ({
        id: row.id,
        type: row.type as WalletEntryType,
        amount: Number(row.amount),
        label: row.referenceId || row.id,
        referenceId: row.referenceId,
        at: row.createdAt || '—',
        status: row.status,
      }));

      setWallet({
        available: wData.available,
        held: wData.held,
        debt: wData.debt,
        currency: wData.currency,
        history: entries
      });
      setLoaded(true);
      setLoadError('');
    } catch {
      setLoadError(historyTr('loadError'));
    } finally {
      if (manual) setIsLoading(false);
    }
  }, [token, historyTr]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      void loadData(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadData]);

  const filteredHistory = wallet.history.filter(entry => {
    if (filter === "ALL") return true;
    return entry.type === filter;
  });

  return (
    <main className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            <Wallet size={24} className={styles.titleIcon} aria-hidden="true" />
            {tr("m1293")}
          </h1>
          <p className={styles.sub}>{tr("m1295")}</p>
        </div>
        {token ? (
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => loadData(true)}
            disabled={isLoading}
            aria-label="Cập nhật số dư"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Đang đồng bộ..." : "Cập nhật"}
          </button>
        ) : null}
      </div>

      {loadError && <p role="alert">{loadError}</p>}

      {!token ? (
        <div className={styles.authBanner}>
          <div>
            <strong>Vui lòng đăng nhập</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--wg-text-secondary)" }}>
              Đăng nhập để xem số dư ví thực tế, tiền ký quỹ đơn hàng và lịch sử giao dịch.
            </p>
          </div>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onNavigate("login")}
          >
            <LogIn size={16} />
            Đăng nhập ngay
          </button>
        </div>
      ) : null}

      {wallet.debt > 0 ? (
        <div className={styles.debtBanner} role="alert">
          <AlertTriangle size={24} className={styles.debtIcon} />
          <div className={styles.debtContent}>
            <strong>Tài khoản đang có dư nợ: {wallet.debt.toLocaleString("vi-VN")} ₫</strong>
            <p>
              Dư nợ phát sinh do phí dịch vụ từ các đơn ONSITE tiền mặt chưa được thanh toán. Bạn cần nạp bù tối thiểu số tiền này để gỡ hạn chế nhận việc và tạo đơn mới.
            </p>
          </div>
          <button
            type="button"
            className={styles.debtButton}
            onClick={() => onNavigate("payment-gateway")}
          >
            Nạp bù ngay
          </button>
        </div>
      ) : null}

      <div className={styles.walletGrid}>
        <div className={styles.summaryCol}>
          <section className={`${styles.balance} ${styles.balanceAvailable}`} aria-label={tr("m1291")}>
            <span className={styles.balanceLabel}>{tr("m1297")}</span>
            <strong className={`${styles.balanceValue} ${styles.balanceValueAvailable}`}>
              {loaded ? wallet.available.toLocaleString("vi-VN") + ' ₫' : '—'}
            </strong>
            <span className={styles.balanceDesc}>
              Sẵn sàng để đặt dịch vụ hoặc rút về tài khoản ngân hàng
            </span>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => onNavigate("payment-gateway")}
              >
                <PlusCircle size={16} />
                Nạp tiền vào ví
              </button>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => onNavigate("payout-settings")}
              >
                <Landmark size={16} />
                {tr("m1283")}
              </button>
            </div>
          </section>

          <section className={`${styles.balance} ${styles.balanceHeld}`} aria-label={tr("m1290")}>
            <span className={styles.balanceLabel}>{tr("m1296")}</span>
            <strong className={`${styles.balanceValue} ${styles.balanceValueHeld}`}>
              —
            </strong>
            <span className={styles.balanceDesc}>
              {historyTr('escrowDetails')}
            </span>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => onNavigate("orders")}
              >
                <ShieldCheck size={16} />
                Xem ký quỹ đơn hàng
              </button>
            </div>
          </section>

          <section className={`${styles.balance} ${styles.balanceDebt}`} aria-label="Dư nợ tài khoản">
            <span className={styles.balanceLabel}>Dư nợ tài khoản</span>
            <strong className={`${styles.balanceValue} ${wallet.debt > 0 ? styles.balanceValueDebt : ""}`}>
              {loaded ? wallet.debt.toLocaleString("vi-VN") + ' ₫' : '—'}
            </strong>
            <span className={styles.balanceDesc}>
              {!loaded ? '—' : wallet.debt > 0
                ? "Cần nạp bù để tiếp tục nhận việc hoặc tạo đơn mới"
                : "Tài khoản sạch, không có dư nợ nợ phí"}
            </span>
            {wallet.debt > 0 ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.debtButton}
                  onClick={() => onNavigate("payment-gateway")}
                >
                  <ArrowUpRight size={16} />
                  Nạp bù {wallet.debt.toLocaleString("vi-VN")} ₫
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <section className={styles.historyCol} aria-label={tr("m1292")}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{tr("m1292")}</h2>
            <div className={styles.filterTabs} role="tablist" aria-label="Bộ lọc lịch sử ví">
              {(
                [
                  { key: "ALL", label: "Tất cả" },
                  { key: "TOPUP", label: "Nạp tiền" },
                  { key: "FEE_DEBT", label: "Nợ phí" },
                  { key: "PAYOUT", label: "Rút tiền" },
                ] as const
              ).map(t => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === t.key}
                  className={filter === t.key ? `${styles.filterTab} ${styles.filterTabActive}` : styles.filterTab}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className={styles.empty}>
              <CreditCard size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
              <p>{!token ? historyTr('loginToView') : loaded ? tr("m1298") : historyTr('loading')}</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{tr("m1299")}</th>
                    <th scope="col">{tr("m1300")}</th>
                    <th scope="col">{tr("m1301")}</th>
                    <th scope="col">{historyTr('status')}</th>
                    <th scope="col">{tr("m1302")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(h => {
                    return (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{h.label}</div>
                          {h.referenceId ? (
                            <small style={{ color: "var(--wg-text-secondary)", fontSize: "0.75rem" }}>
                              Mã: {h.referenceId}
                            </small>
                          ) : null}
                          {h.type === 'TOPUP' && ['INITIATED', 'PENDING', 'UNKNOWN'].includes(h.status || '') && <button type="button" onClick={() => onNavigate('payment-gateway', { topUpId: h.id })}>{historyTr('resumeTopUp')}</button>}
                        </td>
                        <td>
                          <span className={getBadgeClass(h.type)}>
                            {getTypeLabel(h.type)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={styles.amountNeutral}
                          >
                            {h.amount.toLocaleString("vi-VN")} ₫
                          </span>
                        </td>
                        <td>
                          {h.status || '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: "0.85rem", color: "var(--wg-text-secondary)" }}>
                            {h.at}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
