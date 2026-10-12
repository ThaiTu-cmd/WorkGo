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
  const c = getInfoContent(locale, "privacy");
  return {
    title: `${c.title} — WorkGo`,
    description: c.desc,
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  const label = locale === "en" ? "Privacy Policy" : "Chính sách bảo mật";

  return (
    <InfoPageShell locale={locale} pageKey="privacy" breadcrumb={label} />
  );
}
