import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  const { locale } = await params;
  if (locale === "en") {
    redirect("/vi");
  }
  return <WebAppShell />;
}
