import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "WorkGo — Sàn Dịch vụ",
  description:
    "WorkGo — Sàn kết nối dịch vụ: tìm kiếm, đặt dịch vụ, quản lý dịch vụ và bảo chứng Escrow an toàn.",
};

export default function RootPage() {
  redirect("/vi");
}
