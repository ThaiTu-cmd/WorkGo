export type Review = {
  orderId: string;
  stars: number;
  comment: string;
  at: string;
};

export const mockReviews: Review[] = [
  {
    orderId: "ORD-1038",
    stars: 5,
    comment: "Dịch vụ thiết kế logo và nhận diện thương hiệu rất chuyên nghiệp, hoàn thành đúng hạn cam kết!",
    at: "2026-10-06",
  },
  {
    orderId: "ORD-1042",
    stars: 4,
    comment: "Thợ điện lạnh nhiệt tình, khảo sát kỹ và kiểm tra gas điều hòa cẩn thận, bảo hành chu đáo.",
    at: "2026-10-09",
  },
  {
    orderId: "ORD-1021",
    stars: 5,
    comment: "Giao đồ ăn trưa đúng giờ, thực đơn phong phú và sạch sẽ, văn phòng rất hài lòng.",
    at: "2026-09-20",
  },
];
