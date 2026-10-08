import type { Metadata } from "next";
import { WorkgoLandingPage } from "@/components/landing/workgo-landing-page";

export const metadata: Metadata = {
  title: "WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp",
  description:
    "Nền tảng kết nối nhân sự và dịch vụ chuyên nghiệp hàng đầu với cơ chế bảo chứng Escrow và quản lý tiến độ thời gian thực.",
};

export default async function LandingPageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <WorkgoLandingPage locale={locale} />;
}
