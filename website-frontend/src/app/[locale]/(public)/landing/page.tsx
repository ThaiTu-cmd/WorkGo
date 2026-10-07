import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WorkGo — Nền Tảng Kết Nối Việc Làm & Dịch Vụ Chuyên Nghiệp",
  description:
    "Nền tảng kết nối nhân sự và dịch vụ chuyên nghiệp hàng đầu với cơ chế bảo chứng Escrow và quản lý tiến độ thời gian thực.",
};

export default function LandingPageRoute() {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#04060f]">
      <iframe
        src="/landing/index.html"
        title="Ascend Platform Landing Page"
        className="w-full h-full border-0"
      />
    </div>
  );
}
