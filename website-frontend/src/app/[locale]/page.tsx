import type { Metadata } from "next";
import WebAppShell from "@/components/webapp-bridge/webapp-shell";

export const metadata: Metadata = {
  title: "WorkGo — Sàn Dịch vụ",
  description:
    "WorkGo — Sàn kết nối dịch vụ: tìm kiếm, đặt dịch vụ, quản lý dịch vụ và bảo chứng Escrow an toàn.",
};

export default async function LocaleRootPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await params;
  const sp = await searchParams;
  const pageParam = typeof sp?.page === "string" ? sp.page : undefined;
  return <WebAppShell initialPage={pageParam} />;
}
