export type ProviderServiceRef = {
  serviceId: string;
  title: string;
};

export type Provider = {
  providerId: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  ordersInQueue: number;
  bio: string;
  services: ProviderServiceRef[];
};

export const mockProviders: Provider[] = [
  {
    providerId: "pv-1",
    name: "Designer Hoàng Nam",
    avatar: "https://example.com/avatars/hoang-nam.png",
    rating: 4.9,
    reviewCount: 212,
    ordersInQueue: 3,
    bio: "Designer 6 năm kinh nghiệm thương hiệu F&B, đã bàn giao 300+ bộ logo, cam kết chỉnh sửa đến khi hài lòng.",
    services: [
      { serviceId: "svc-1", title: "Thiết kế logo quán cà phê trọn gói" },
      { serviceId: "svc-2", title: "Bộ nhận diện thương hiệu F&B" },
      { serviceId: "svc-3", title: "Thiết kế menu và bao bì" },
    ],
  },
  {
    providerId: "pv-2",
    name: "Thợ Điện Lạnh Đức Huy",
    avatar: "https://example.com/avatars/duc-huy.png",
    rating: 4.8,
    reviewCount: 167,
    ordersInQueue: 5,
    bio: "Thợ điện lạnh 10 năm kinh nghiệm, khảo sát miễn phí nội thành, báo giá trọn gói và bảo hành 6 tháng.",
    services: [
      { serviceId: "svc-4", title: "Vệ sinh điều hòa tại nhà" },
      { serviceId: "svc-5", title: "Sửa chữa tủ lạnh tận nơi" },
    ],
  },
  {
    providerId: "pv-3",
    name: "Studio Sáng Tạo Mới",
    avatar: "https://example.com/avatars/sang-tao-moi.png",
    rating: 4.7,
    reviewCount: 98,
    ordersInQueue: 2,
    bio: "Studio 12 thành viên chuyên branding và content, quy trình 3 vòng duyệt, bàn giao đầy đủ file gốc.",
    services: [
      { serviceId: "svc-6", title: "Thiết kế logo startup công nghệ" },
      { serviceId: "svc-7", title: "Viết bài SEO website bán hàng" },
    ],
  },
];
