// UI-only static: no API change
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";
import { getGuideDetail } from "@/lib/landing/info-content";
import { FiverrHeader } from "@/components/landing/fiverr/fiverr-header";
import { FiverrFooter } from "@/components/landing/fiverr/fiverr-footer";
import { FiverrReveal } from "@/components/landing/fiverr/fiverr-reveal";
import { GuideArt } from "@/components/landing/art/landing-art";

export function generateStaticParams(): Array<{ id: string }> {
  return [
    { id: "guide-brief" },
    { id: "guide-portfolio" },
    { id: "guide-budget" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const detail = getGuideDetail(locale, id);
  if (!detail) {
    return { title: "Guide Not Found — WorkGo" };
  }
  return {
    title: `${detail.guide.title} — WorkGo Guides`,
    description: detail.body[0] ?? "Cẩm nang hướng dẫn phát triển sự nghiệp freelance cùng WorkGo.",
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<React.JSX.Element> {
  const { locale, id } = await params;
  const detail = getGuideDetail(locale, id);

  if (!detail) {
    notFound();
  }

  const { guide, body, steps, relatedQ } = detail;
  const homeLabel = locale === "en" ? "Home" : "Trang chủ";
  const guidesLabel = locale === "en" ? "Guides" : "Cẩm nang";
  const backLabel = locale === "en" ? "Back to all guides" : "Quay lại danh sách hướng dẫn";
  const stepsHeading = locale === "en" ? "Step-by-Step Action Plan" : "Các bước thực hiện chuẩn";
  const relatedActionLabel = locale === "en" ? `Explore related services: "${relatedQ}"` : `Tìm dịch vụ liên quan: "${relatedQ}"`;
  const footerLabel = locale === "en" ? "Footer" : "Chân trang";

  return (
    <div className="min-h-screen bg-white text-[#222325] flex flex-col font-sans">
      <FiverrHeader locale={locale} />

      {/* Breadcrumb */}
      <div className="border-b border-[#E4E5E7] bg-[#FAFAFA] py-3">
        <div className="mx-auto max-w-[1000px] px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs md:text-sm text-[#62646A]">
            <Link
              href={`/${locale}`}
              className="hover:text-[#222325] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded"
            >
              {homeLabel}
            </Link>
            <span>/</span>
            <Link
              href={`/${locale}/guides`}
              className="hover:text-[#222325] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded"
            >
              {guidesLabel}
            </Link>
            <span>/</span>
            <span className="font-medium text-[#222325] truncate max-w-xs md:max-w-md">
              {guide.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main article */}
      <main className="flex-1 py-10 md:py-16">
        <div className="mx-auto max-w-[1000px] px-6">
          <FiverrReveal>
            <div className="mb-6">
              <Link
                href={`/${locale}/guides`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1677FF] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{backLabel}</span>
              </Link>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#222325] leading-tight mb-8">
              {guide.title}
            </h1>

            {/* Visual Header Banner */}
            <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-md mb-10">
              <GuideArt from={guide.from} icon={guide.icon} />
            </div>

            {/* Article Content */}
            <div className="space-y-6 text-base md:text-lg text-[#404145] leading-relaxed">
              {body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Checklist / Action Steps */}
            <div className="my-10 rounded-2xl border border-[#E4E5E7] bg-[#FAFAFA] p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-[#222325] mb-5">
                {stepsHeading}
              </h2>
              <ul className="space-y-4">
                {steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#1DBF73] mt-0.5 shrink-0" />
                    <span className="text-base md:text-lg font-medium text-[#222325]">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Step CTA */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#1677FF]/20 bg-[#F0F7FF] p-6">
              <div>
                <h3 className="font-bold text-lg text-[#222325]">
                  {locale === "en" ? "Ready to apply this?" : "Sẵn sàng áp dụng cẩm nang?"}
                </h3>
                <p className="text-sm text-[#62646A] mt-1">
                  {relatedActionLabel}
                </p>
              </div>
              <Link
                href={`/${locale}/posts?q=${encodeURIComponent(relatedQ)}`}
                className="fiverr-press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1677FF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0B4DBB]"
              >
                <Search className="h-4 w-4" />
                <span>{locale === "en" ? "Search marketplace" : "Khám phá việc làm"}</span>
              </Link>
            </div>
          </FiverrReveal>
        </div>
      </main>

      <FiverrFooter locale={locale} regionLabel={footerLabel} />
    </div>
  );
}
