/**
 * footerLinks.js: Danh mục 21 liên kết chân trang WorkGo được chuẩn hóa.
 * Không chứa mã JSX để tương thích hoàn toàn với Node.js ESM test runner và bundling.
 */

export const FOOTER_COLUMNS = [
  {
    title: 'Danh mục dịch vụ',
    links: [
      { label: 'Lập trình & Công nghệ', page: 'catalog', params: { category: 'lap-trinh-cong-nghe' } },
      { label: 'Thiết kế đồ họa & UI/UX', page: 'catalog', params: { category: 'thiet-ke-do-hoa' } },
      { label: 'Sửa chữa Điện nước', page: 'catalog', params: { category: 'sua-chua-dien-nuoc' } },
      { label: 'Vệ sinh & Dọn dẹp', page: 'catalog', params: { category: 've-sinh-don-dep' } },
      { label: 'Viết lách & Dịch thuật', page: 'catalog', params: { category: 'viet-lach-dich-thuat' } },
      { label: 'Marketing & Quảng cáo', page: 'catalog', params: { category: 'marketing-quang-cao' } },
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
