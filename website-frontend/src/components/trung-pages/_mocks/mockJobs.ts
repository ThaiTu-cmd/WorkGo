export type JobType = "DIGITAL" | "ONSITE" | "DELIVERY" | "APPOINTMENT";

export type Job = {
  jobId: string;
  title: string;
  description: string;
  budget: number;
  type: JobType;
  clientName: string;
  createdAt: string;
};

export const JOB_TYPES: JobType[] = ["DIGITAL", "ONSITE", "DELIVERY", "APPOINTMENT"];

export const mockJobs: Job[] = [
  {
    jobId: "job-1",
    title: "Thiết kế logo thương hiệu quán cà phê sân vườn",
    description:
      "Cần thiết kế bộ logo nhận diện cho quán cà phê sân vườn, bao gồm logo chính, logo phụ và bộ màu thương hiệu chi tiết.",
    budget: 2500000,
    type: "DIGITAL",
    clientName: "Chị Lan Anh",
    createdAt: "2026-09-20",
  },
  {
    jobId: "job-2",
    title: "Sửa chữa điều hòa tại nhà quận Bình Thạnh",
    description:
      "Điều hòa 1.5HP không lạnh sâu, cần thợ kiểm tra gas, vệ sinh dàn lạnh và báo giá sửa chữa trọn gói tại nhà.",
    budget: 800000,
    type: "ONSITE",
    clientName: "Anh Minh Quân",
    createdAt: "2026-09-25",
  },
  {
    jobId: "job-3",
    title: "Giao 50 phần cơm trưa văn phòng mỗi ngày",
    description:
      "Cần đơn vị giao 50 phần cơm trưa văn phòng mỗi ngày trong tuần, thực đơn thay đổi, giao đúng 11 giờ trưa mỗi ngày.",
    budget: 15000000,
    type: "DELIVERY",
    clientName: "Công ty Sao Mai",
    createdAt: "2026-10-01",
  },
  {
    jobId: "job-4",
    title: "Đặt lịch chụp ảnh cưới ngoại cảnh Đà Lạt",
    description:
      "Cặp đôi cần ekip chụp ảnh cưới ngoại cảnh 2 ngày tại Đà Lạt, bao gồm make-up, trang phục và album ảnh cao cấp.",
    budget: 25000000,
    type: "APPOINTMENT",
    clientName: "Anh Tuấn Anh",
    createdAt: "2026-10-05",
  },
  {
    jobId: "job-5",
    title: "Viết bài chuẩn SEO cho website bán đồ gia dụng",
    description:
      "Cần viết 20 bài chuẩn SEO dài từ 1200 từ cho website bán đồ gia dụng, đúng insight khách hàng và tối ưu từ khóa.",
    budget: 1200000,
    type: "DIGITAL",
    clientName: "Shop Gia Dụng Việt",
    createdAt: "2026-10-08",
  },
  {
    jobId: "job-6",
    title: "Lắp đặt hệ thống camera cho cửa hàng 3 tầng",
    description:
      "Cửa hàng 3 tầng cần lắp 12 mắt camera, đầu ghi 16 kênh, xem từ xa qua điện thoại và bảo hành 12 tháng đầy đủ.",
    budget: 45000000,
    type: "ONSITE",
    clientName: "Cửa hàng Phát Đạt",
    createdAt: "2026-10-10",
  },
];
