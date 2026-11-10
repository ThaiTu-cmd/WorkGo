export const FOOTER_COLUMNS = [
  {
    title: 'Danh mục dịch vụ',
    links: [
      { label: 'Tất cả dịch vụ', page: 'catalog' },
      { label: 'Lập trình & IT', page: 'catalog', params: { category: 'lap-trinh-it' } },
      { label: 'Thiết kế Đồ họa', page: 'catalog', params: { category: 'thiet-ke-do-hoa' } },
      { label: 'Viết lách & Dịch thuật', page: 'catalog', params: { category: 'viet-lach-dich-thuat' } },
    ],
  },
  {
    title: 'Dành cho Khách hàng',
    links: [
      { label: 'Cách thức đặt dịch vụ', page: 'how-it-works' },
      { label: 'Bảo chứng Ký quỹ (Escrow)', page: 'escrow-protection' },
      { label: 'Đăng tin tuyển dụng', page: 'job-post' },
      { label: 'Chính sách hoàn tiền', page: 'refund-policy' },
      { label: 'Câu hỏi thường gặp (FAQ)', page: 'faq' },
    ],
  },
  {
    title: 'Dành cho Chuyên gia',
    links: [
      { label: 'Trở thành Chuyên gia', page: 'provider-onboarding' },
      { label: 'Tiêu chuẩn xác thực', page: 'verification-standards' },
      { label: 'Quy định gói dịch vụ', page: 'package-rules' },
      { label: 'Rút tiền & Thanh toán', page: 'payout-settings' },
      { label: 'Cộng đồng Freelancer', page: 'community' },
    ],
  },
  {
    title: 'Về WorkGo',
    links: [
      { label: 'Giới thiệu nền tảng', page: 'about' },
      { label: 'Cơ hội nghề nghiệp', page: 'careers' },
      { label: 'Điều khoản sử dụng', page: 'terms' },
      { label: 'Chính sách bảo mật', page: 'privacy' },
      { label: 'Liên hệ & Trợ giúp 24/7', page: 'contact' },
    ],
  },
];
