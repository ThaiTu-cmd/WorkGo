import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AdminPayouts, AdminReconciliation, FeePolicies } from "@/components/admin/AdminFinance";
import { AdminAudit, OrderMonitoring } from "@/components/admin/AdminMonitoring";
import AdminCases from "@/components/admin/AdminCases";
import AdminSanctions from "@/components/admin/AdminSanctions";
import AdminEscrow from "@/components/admin/AdminEscrow";
import AdminScoreReviews from "@/components/admin/AdminScoreReviews";

export default async function AdminSection({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  if (section === "fees") return <FeePolicies />;
  if (section === "monitoring") return <OrderMonitoring />;
  if (section === "audit") return <AdminAudit />;
  if (section === "reconciliation") return <AdminReconciliation />;
  if (section === "payouts") return <AdminPayouts />;
  if(section==='jobs'||section==='reviews'||section==='reports'||section==='disputes')return <AdminCases section={section}/>;
  if(section==='sanctions')return <AdminSanctions/>;
  if(section==='escrow')return <AdminEscrow/>;
  if(section==='score-reviews')return <AdminScoreReviews/>;
  if (!["jobs", "reviews", "reports", "disputes", "sanctions"].includes(section)) notFound();
  const t = await getTranslations({ locale, namespace: "adminPending" });
  return <section><h1>{t(section)}</h1><p role="status">{t("unavailable")}</p></section>;
}
