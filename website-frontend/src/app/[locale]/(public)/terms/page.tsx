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
  const c = getInfoContent(locale, "terms");
  return {
    title: `${c.title} — WorkGo`,
    description: c.desc,
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  const label = locale === "en" ? "Terms of Service" : "Điều khoản dịch vụ";

  return (
    <InfoPageShell locale={locale} pageKey="terms" breadcrumb={label} />
  );
}
