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
  const c = getInfoContent(locale, "help");
  return {
    title: `${c.title} — WorkGo`,
    description: c.desc,
  };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  const label = locale === "en" ? "Help Center" : "Trung tâm hỗ trợ";

  return (
    <InfoPageShell locale={locale} pageKey="help" breadcrumb={label} />
  );
}
