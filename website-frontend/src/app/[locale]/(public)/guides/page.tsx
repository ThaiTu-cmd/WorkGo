// UI-only static: no API change
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getInfoContent } from "@/lib/landing/info-content";
import { getFiverrContent } from "@/lib/landing/fiverr-content";
import { InfoPageShell } from "@/components/landing/info/info-page-shell";
import { GuideArt } from "@/components/landing/art/landing-art";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = getInfoContent(locale, "guides");
  return {
    title: `${c.title} — WorkGo`,
    description: c.desc,
  };
}

export default async function GuidesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  const label = locale === "en" ? "Guides" : "Hướng dẫn";
  const fiverrContent = getFiverrContent(locale);
  const guides = fiverrContent.guides.items;

  return (
    <InfoPageShell locale={locale} pageKey="guides" breadcrumb={label}>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222325] mb-6">
          {locale === "en" ? "Featured Guides & Best Practices" : "Các cẩm nang & kinh nghiệm thực chiến"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/${locale}/guides/${guide.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E4E5E7] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#C5C6C9] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <GuideArt from={guide.from} icon={guide.icon} />
              </div>
              <div className="p-5 flex flex-1 flex-col justify-between">
                <h3 className="font-bold text-base md:text-lg text-[#222325] group-hover:text-[#1677FF] transition-colors leading-snug">
                  {guide.title}
                </h3>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#1677FF]">
                  <span>{locale === "en" ? "Read full guide" : "Đọc chi tiết"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </InfoPageShell>
  );
}
