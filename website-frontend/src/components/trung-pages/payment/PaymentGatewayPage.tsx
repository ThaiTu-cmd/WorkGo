"use client";

// transparency badge: Mock Demo
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import type { CatalogFilterParams, TrungPageKey } from "../../webapp-bridge/webapp-shell";
import styles from "./PaymentGatewayPage.module.css";

export type TrungPageProps = {
  onNavigate: (page: TrungPageKey, params?: CatalogFilterParams) => void;
  onShowToast: (message: string) => void;
};

type Tab = "STRIPE" | "VNPAY" | "MOMO";

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
      setError(
        tr("m1461", {
          p0: (50000).toLocaleString("vi-VN")
        })
      );
      return;
    }
    if (amount > 100000000) {
      setError(
        tr("m1462", {
          p0: (100000000).toLocaleString("vi-VN")
        })
      );
      return;
    }
    setError("");
    onShowToast(
      "Hệ thống WorkGo chỉ hỗ trợ thanh toán Escrow theo từng đơn hàng cụ thể. Vui lòng thanh toán trực tiếp từ chi tiết đơn hàng."
    );
    onNavigate("orders");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <CreditCard size={24} className={styles.titleIcon} aria-hidden="true" />
          {tr("m1272")}
        </h1>
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "var(--warning-bg, #fef3c7)",
            border: "1px solid var(--border-default, #fde68a)",
            borderRadius: "8px",
            color: "var(--text-primary, #92400e)",
            fontSize: "0.85rem",
            marginBottom: "16px",
            fontWeight: 500,
            lineHeight: 1.5
          }}
        >
          <strong>{tr("m1273")}</strong>: Cổng thanh toán WorkGo tích hợp VNPay, MoMo cho các đơn dịch vụ cụ thể thông qua cơ chế Ký quỹ (Escrow). Tính năng nạp ví cá nhân độc lập hiện chưa được backend hỗ trợ.
        </div>
        <p className={styles.sub}>{tr("m1274")}</p>

        <div className={styles.tabs} role="tablist" aria-label={tr("m488")}>
          {(["STRIPE", "VNPAY", "MOMO"] as const).map(t => (
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

        <div
          style={{
            margin: "20px 0",
            padding: "20px",
            borderRadius: "12px",
            border: "1px dashed var(--border-default, #cbd5e1)",
            textAlign: "center",
            backgroundColor: "var(--surface-subtle, #f8fafc)"
          }}
        >
          <ShieldCheck size={36} color="var(--primary, #1677FF)" style={{ marginBottom: "8px" }} />
          <p style={{ fontWeight: 600, color: "var(--text-primary, #1e293b)", marginBottom: "4px" }}>
            Thanh toán an toàn qua {tab === "STRIPE" ? "Stripe" : tab === "VNPAY" ? "VNPay" : "MoMo"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)" }}>
            Mã thanh toán thực tế sẽ được sinh tự động khi quý khách xác nhận đơn dịch vụ tại trang Checkout.
          </p>
        </div>

        <label className={styles.field} htmlFor="wg-payment-amount">
          <span>{tr("m1276")}</span>
          <input
            id="wg-payment-amount"
            value={amountRaw}
            onChange={e => setAmountRaw(e.target.value)}
            placeholder="500000"
            inputMode="numeric"
          />
        </label>
        {error ? <em className={styles.error}>{error}</em> : null}
        <button type="button" className={styles.submit} onClick={confirm}>
          {tr("m1277")}
        </button>
      </div>
    </main>
  );
}
