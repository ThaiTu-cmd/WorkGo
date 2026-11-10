import type { Metadata } from "next";
import WebAppShell from "@/components/webapp-bridge/webapp-shell";

export const metadata: Metadata = {
  title: "WorkGo — Sàn Dịch vụ",
  description:
    "WorkGo — Sàn kết nối dịch vụ: tìm kiếm, đặt dịch vụ, quản lý dịch vụ và bảo chứng Escrow an toàn.",
};

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params; // locale unused: web-app UI is VI-only (known limitation E5)
  return <WebAppShell />;
}
