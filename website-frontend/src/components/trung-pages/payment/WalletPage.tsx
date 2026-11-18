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
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import { paymentApi, useAuthToken } from "../../webapp-bridge/backend";
import type { WalletEntry, WalletState, WalletEntryType } from "./paymentTypes";
import styles from "./WalletPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

type FilterType = "ALL" | WalletEntryType;

const parseWalletResponse = (res: unknown): { available: number; held: number; debt: number; currency: string } => {
  const r = res as { result?: Record<string, unknown> } & Record<string, unknown>;
  const data = r?.result ?? r ?? {};
  const available = Number(data.availableBalance ?? data.available ?? 0);
  const held = Number(data.heldBalance ?? data.held ?? 0);
  const debt = Number(data.debtBalance ?? data.debt ?? 0);
  const currency = String(data.currency ?? "VND");
  return {
    available: Number.isFinite(available) ? available : 0,
    held: Number.isFinite(held) ? held : 0,
    debt: Number.isFinite(debt) ? debt : 0,
    currency
  };
};

const parseLedgerEntries = (res: unknown): WalletEntry[] => {
  const r = res as { result?: { content?: unknown[] } | unknown[] } & Record<string, unknown>;
  const rawList = (r?.result && typeof r.result === "object" && "content" in r.result
    ? (r.result as { content?: unknown[] }).content
    : r?.result ?? (Array.isArray(r) ? r : [])) as unknown[];

  if (!Array.isArray(rawList)) return [];

  return rawList.map((item: unknown, idx: number) => {
    const it = item as Record<string, unknown>;
    return {
      id: String(it.id ?? it.entryId ?? `w-${idx}`),
      type: (it.entryType ?? it.type ?? "ADJUSTMENT") as WalletEntryType,
      amount: Number(it.amount ?? 0),
      balanceAfter: it.balanceAfter !== undefined ? Number(it.balanceAfter) : undefined,
      label: String(it.description ?? it.label ?? it.reason ?? "Giao dịch ví"),
      referenceId: it.referenceId ? String(it.referenceId) : undefined,
      at: String(it.createdAt ?? it.at ?? new Date().toISOString().slice(0, 10)),
      status: it.status as WalletEntry["status"]
    };
  });
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
  onNavigate,
  onShowToast
}: TrungPageProps) {
  const tr = useTranslations("misc");
  const token = useAuthToken();
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
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
      const [walletRes, ledgerRes] = await Promise.allSettled([
        paymentApi.getWallet(),
        paymentApi.getWalletLedger({ page: 0, size: 50 })
      ]);

      let wData = { available: 0, held: 0, debt: 0, currency: "VND" };
      if (walletRes.status === "fulfilled" && walletRes.value) {
        wData = parseWalletResponse(walletRes.value);
      }

      let entries: WalletEntry[] = [];
      if (ledgerRes.status === "fulfilled" && ledgerRes.value) {
        entries = parseLedgerEntries(ledgerRes.value);
      }

      setWallet({
        available: wData.available,
        held: wData.held,
        debt: wData.debt,
        currency: wData.currency,
        history: entries
      });
    } catch {
      onShowToast("Không thể đồng bộ dữ liệu ví từ máy chủ.");
    } finally {
      if (manual) setIsLoading(false);
    }
  }, [token, onShowToast]);

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

      <div
        style={{
          marginTop: "16px",
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
        <strong>{tr("m1294")}</strong>: Hệ thống WorkGo áp dụng thanh toán qua ví và ký quỹ (Escrow). Tiền nạp vào ví sẵn sàng để thanh toán đơn hàng mới hoặc nạp bù dư nợ. Tiền ký quỹ được giữ an toàn tại cổng thanh toán và chỉ giải phóng cho chuyên gia khi đơn hoàn tất nghiệm thu.
      </div>

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
              {wallet.available.toLocaleString("vi-VN")} ₫
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
              {wallet.held.toLocaleString("vi-VN")} ₫
            </strong>
            <span className={styles.balanceDesc}>
              Đang tạm giữ bảo đảm cho các đơn hàng đang tiến hành
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
              {wallet.debt.toLocaleString("vi-VN")} ₫
            </strong>
            <span className={styles.balanceDesc}>
              {wallet.debt > 0
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
                  { key: "HOLD", label: "Ký quỹ" },
                  { key: "RELEASE", label: "Giải ngân" },
                  { key: "FEE_DEBT", label: "Nợ phí" },
                  { key: "PAYOUT", label: "Rút tiền" },
                  { key: "REFUND", label: "Hoàn tiền" }
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
              <p>{tr("m1298")}</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{tr("m1299")}</th>
                    <th scope="col">{tr("m1300")}</th>
                    <th scope="col">{tr("m1301")}</th>
                    <th scope="col">Số dư sau</th>
                    <th scope="col">{tr("m1302")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(h => {
                    const isCredit = h.type === "TOPUP" || h.type === "RELEASE" || h.type === "REFUND";
                    const isDebit = h.type === "HOLD" || h.type === "FEE_DEBT" || h.type === "PAYOUT";
                    return (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{h.label}</div>
                          {h.referenceId ? (
                            <small style={{ color: "var(--wg-text-secondary)", fontSize: "0.75rem" }}>
                              Mã: {h.referenceId}
                            </small>
                          ) : null}
                        </td>
                        <td>
                          <span className={getBadgeClass(h.type)}>
                            {getTypeLabel(h.type)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              isCredit
                                ? styles.amountPlus
                                : isDebit
                                ? styles.amountMinus
                                : styles.amountNeutral
                            }
                          >
                            {isCredit ? "+" : isDebit ? "-" : ""}
                            {h.amount.toLocaleString("vi-VN")} ₫
                          </span>
                        </td>
                        <td>
                          {h.balanceAfter !== undefined
                            ? `${h.balanceAfter.toLocaleString("vi-VN")} ₫`
                            : "—"}
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
