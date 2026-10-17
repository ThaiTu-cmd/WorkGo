import React from 'react';
import { Globe, Shield } from 'lucide-react';
import styles from './Footer.module.css';

const COLUMNS = [
  {
    title: 'Danh mục dịch vụ',
    links: [
      ['#categories', 'Lập trình & Công nghệ'],
      ['#categories', 'Thiết kế đồ họa & UI/UX'],
      ['#categories', 'Sửa chữa Điện nước'],
      ['#categories', 'Vệ sinh & Dọn dẹp'],
      ['#categories', 'Viết lách & Dịch thuật'],
      ['#categories', 'Marketing & Quảng cáo'],
    ],
  },
  {
    title: 'Dành cho Khách hàng',
    links: [
      ['#how-it-works', 'Cách thức đặt dịch vụ'],
      ['#why-workgo', 'Bảo chứng Ký quỹ (Escrow)'],
      ['#cta', 'Đăng tin tuyển dụng'],
      ['#', 'Chính sách hoàn tiền'],
      ['#', 'Câu hỏi thường gặp (FAQ)'],
    ],
  },
  {
    title: 'Dành cho Chuyên gia',
    links: [
      ['#cta', 'Trở thành Chuyên gia'],
      ['#', 'Tiêu chuẩn xác thực'],
      ['#', 'Quy định gói dịch vụ'],
      ['#', 'Rút tiền & Thanh toán'],
      ['#', 'Cộng đồng Freelancer'],
    ],
  },
  {
    title: 'Về WorkGo',
    links: [
      ['#', 'Giới thiệu nền tảng'],
      ['#', 'Cơ hội nghề nghiệp'],
      ['#', 'Điều khoản sử dụng'],
      ['#', 'Chính sách bảo mật'],
      ['#', 'Liên hệ & Trợ giúp 24/7'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          {/* Brand column */}
          <div className={styles.brandCol}>
            <span className={styles.footerLogo}>WorkGo</span>
            <p className={styles.brandDesc}>
              Nền tảng kết nối khách hàng với chuyên gia và freelancer uy tín — thanh toán an toàn qua ký quỹ.
            </p>
            <span className={styles.escrowBadge}>
              <Shield size={15} />
              Được bảo vệ bởi Escrow
            </span>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.col}>
              <h4 className={styles.colTitle}>{col.title}</h4>
              <ul className={styles.linkList}>
                {col.links.map(([href, label]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottomBar}>
          <span className={styles.copyright}>
            © 2026 WorkGo Marketplace Inc. Bảo lưu mọi quyền.
          </span>
          <div className={styles.rightBottom}>
            <div className={styles.localeItem}>
              <Globe size={16} />
              <span>Tiếng Việt</span>
            </div>
            <div className={styles.localeItem}>
              <span>₫ VND</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
