// UI-only static: no API change
import type { Metadata } from "next";
import { getInfoContent } from "@/lib/landing/info-content";
import { InfoPageShell } from "@/components/landing/info/info-page-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = getInfoContent(locale, "trustSafety");
  return {
    title: `${c.title} — WorkGo`,
    description: c.desc,
  };
}

export default async function TrustSafetyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  const label = locale === "en" ? "Trust & Safety" : "An toàn & Ký quỹ";

  return (
    <InfoPageShell locale={locale} pageKey="trustSafety" breadcrumb={label} />
  );
}
