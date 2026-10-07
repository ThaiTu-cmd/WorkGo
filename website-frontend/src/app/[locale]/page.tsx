import type { Metadata } from "next";
import { AscendLandingView } from "@/components/landing/ascend-landing-view";

export const metadata: Metadata = {
  title: "WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp",
  description:
    "Nền tảng kết nối nhân sự và dịch vụ chuyên nghiệp hàng đầu với cơ chế bảo chứng Escrow và quản lý tiến độ thời gian thực.",
};

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AscendLandingView locale={locale} />;
}
