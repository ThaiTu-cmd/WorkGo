import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function AdminSection({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  if (!["jobs", "reviews", "reports", "disputes", "fees", "sanctions", "monitoring", "audit", "reconciliation"].includes(section)) notFound();
  const t = await getTranslations({ locale, namespace: "adminPending" });
  return <section><h1>{t(section)}</h1><p role="status">{t("unavailable")}</p></section>;
}
