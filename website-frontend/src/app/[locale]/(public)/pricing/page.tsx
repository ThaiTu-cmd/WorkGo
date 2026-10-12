// UI-only static: no API change
import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getInfoContent } from "@/lib/landing/info-content";
import { InfoPageShell } from "@/components/landing/info/info-page-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = getInfoContent(locale, "pricing");
  return {
    title: `${c.title} — WorkGo`,
    description: c.desc,
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.JSX.Element> {
  const { locale } = await params;
  const label = locale === "en" ? "Pricing" : "Biểu phí";

  const tiers = [
    {
      name: locale === "en" ? "Clients / Employers" : "Khách hàng đăng việc",
      price: "0 VNĐ",
      sub: locale === "en" ? "Free forever" : "Miễn phí trọn đời",
      desc: locale === "en" ? "Post unlimited briefs and hire qualified freelancers" : "Đăng tin tuyển dụng không giới hạn và tiếp cận nhân tài",
      features: [
        locale === "en" ? "Unlimited job briefs" : "Đăng tin không giới hạn",
        locale === "en" ? "Direct freelancer messaging" : "Nhắn tin trực tiếp với ứng viên",
        locale === "en" ? "Free Escrow payment protection" : "Bảo vệ ký quỹ Escrow miễn phí",
        locale === "en" ? "100% money back guarantee" : "Cam kết hoàn tiền 100% khi không đạt",
      ],
      ctaLabel: locale === "en" ? "Post a brief" : "Đăng việc ngay",
      ctaHref: `/${locale}/client/posts/new`,
      highlight: false,
    },
    {
      name: locale === "en" ? "Independent Sellers" : "Đối tác tự do",
      price: "5%",
      sub: locale === "en" ? "Per completed order" : "Trên mỗi đơn hàng hoàn thành",
      desc: locale === "en" ? "Keep 95% of your earnings with instant payouts" : "Giữ lại 95% thu nhập của bạn và rút tiền siêu tốc",
      features: [
        locale === "en" ? "Full profile & portfolio showcase" : "Trang hồ sơ năng lực chuẩn quốc tế",
        locale === "en" ? "Zero monthly membership fee" : "Không thu phí duy trì hàng tháng",
        locale === "en" ? "Guaranteed payout upon completion" : "Đảm bảo nhận tiền khi hoàn thành",
        locale === "en" ? "Instant local bank withdrawal" : "Rút tiền về ngân hàng trong 15 phút",
      ],
      ctaLabel: locale === "en" ? "Become a seller" : "Đăng ký đối tác",
      ctaHref: `/${locale}/register`,
      highlight: true,
    },
    {
      name: locale === "en" ? "WorkGo Pro Enterprise" : "Doanh nghiệp Pro",
      price: locale === "en" ? "Custom" : "Liên hệ",
      sub: locale === "en" ? "Tailored to team size" : "Báo giá theo quy mô",
      desc: locale === "en" ? "Dedicated account management and vetted top 1% talent" : "Quản lý riêng, hóa đơn VAT và chuyên gia top 1%",
      features: [
        locale === "en" ? "Dedicated Account Manager" : "Quản lý tài khoản doanh nghiệp riêng",
        locale === "en" ? "Custom VAT invoicing & Net-30" : "Hóa đơn VAT và hợp đồng nguyên tắc",
        locale === "en" ? "Hand-vetted premium talent" : "Tuyển chọn chuyên gia đầu ngành",
        locale === "en" ? "API & workflow automation" : "Tích hợp API và tự động hóa tác vụ",
      ],
      ctaLabel: locale === "en" ? "Learn about Pro" : "Tìm hiểu WorkGo Pro",
      ctaHref: `/${locale}/pro`,
      highlight: false,
    },
  ];

  return (
    <InfoPageShell locale={locale} pageKey="pricing" breadcrumb={label}>
      <div id="tiers" className="scroll-mt-24">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#222325] mb-6">
          {locale === "en" ? "Platform Service Tiers" : "Các gói dịch vụ nền tảng"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                tier.highlight
                  ? "border-[#1677FF] bg-[#F0F7FF] shadow-md ring-1 ring-[#1677FF]"
                  : "border-[#E4E5E7] bg-white hover:border-[#C5C6C9]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-lg text-[#222325]">{tier.name}</h3>
                  {tier.highlight && (
                    <span className="rounded-full bg-[#1677FF] px-2.5 py-0.5 text-xs font-semibold text-white">
                      {locale === "en" ? "Popular" : "Phổ biến"}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-[#222325]">
                    {tier.price}
                  </span>
                  <span className="text-xs text-[#62646A]">/ {tier.sub}</span>
                </div>
                <p className="mt-2 text-sm text-[#62646A] leading-relaxed">
                  {tier.desc}
                </p>

                <ul className="mt-6 space-y-3 border-t border-[#E4E5E7] pt-6">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-sm text-[#404145]">
                      <Check className="h-4 w-4 text-[#1DBF73] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={tier.ctaHref}
                  className={`fiverr-press flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    tier.highlight
                      ? "bg-[#1677FF] text-white hover:bg-[#0B4DBB]"
                      : "bg-[#222325] text-white hover:bg-black"
                  }`}
                >
                  {tier.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InfoPageShell>
  );
}
