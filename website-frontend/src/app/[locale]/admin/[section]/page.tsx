import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AdminPayouts, AdminReconciliation, FeePolicies } from "@/components/admin/AdminFinance";
import { AdminAudit, OrderMonitoring } from "@/components/admin/AdminMonitoring";

export default async function AdminSection({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  if (section === "fees") return <FeePolicies />;
  if (section === "monitoring") return <OrderMonitoring />;
  if (section === "audit") return <AdminAudit />;
  if (section === "reconciliation") return <AdminReconciliation />;
  if (section === "payouts") return <AdminPayouts />;
  if (!["jobs", "reviews", "reports", "disputes", "sanctions"].includes(section)) notFound();
  const t = await getTranslations({ locale, namespace: "adminPending" });
  return <section><h1>{t(section)}</h1><p role="status">{t("unavailable")}</p></section>;
}
