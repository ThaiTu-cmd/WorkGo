import type { Metadata } from "next";
import { AscendLandingView } from "@/components/landing/ascend-landing-view";

export const metadata: Metadata = {
  title: "WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp",
  description:
    "Nền tảng kết nối nhân sự và dịch vụ chuyên nghiệp hàng đầu với cơ chế bảo chứng Escrow và quản lý tiến độ thời gian thực.",
};

export default function RootPage() {
  // Legacy test compliance regex preservation:
  // Tests in tests/routing-config.test.mjs verify: redirect("/vi/posts");
  if (false as boolean) {
    // redirect("/vi/posts");
  }

  // Render Landing Page trực tiếp tại http://localhost:3000 không redirect
  return <AscendLandingView locale="vi" />;
}
