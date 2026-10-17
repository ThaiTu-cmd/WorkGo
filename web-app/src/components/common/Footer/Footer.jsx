import React from 'react';
import { Globe, Shield } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        {/* Main Footer Links Columns */}
        <div className={styles.columnsGrid}>
          {/* Col 1 */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Danh mục dịch vụ</h4>
            <ul className={styles.linkList}>
              <li><a href="#categories">Lập trình & Công nghệ</a></li>
              <li><a href="#categories">Thiết kế đồ họa & UI/UX</a></li>
              <li><a href="#categories">Sửa chữa Điện nước</a></li>
              <li><a href="#categories">Vệ sinh & Dọn dẹp</a></li>
              <li><a href="#categories">Viết lách & Dịch thuật</a></li>
              <li><a href="#categories">Vận chuyển & Giao nhận</a></li>
              <li><a href="#categories">Marketing & Quảng cáo</a></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Dành cho Khách hàng</h4>
            <ul className={styles.linkList}>
              <li><a href="#how-it-works">Cách thức đặt dịch vụ</a></li>
              <li><a href="#why-workgo">Bảo chứng Ký quỹ (Escrow)</a></li>
              <li><a href="#cta">Đăng tin tuyển dụng (Post Job)</a></li>
              <li><a href="#">Chính sách hoàn tiền & tranh chấp</a></li>
              <li><a href="#">Quy chuẩn nghiệm thu công việc</a></li>
              <li><a href="#">Câu hỏi thường gặp (FAQ)</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Dành cho Chuyên gia</h4>
            <ul className={styles.linkList}>
              <li><a href="#cta">Đăng ký trở thành Chuyên gia</a></li>
              <li><a href="#">Tiêu chuẩn xác thực (Verification)</a></li>
              <li><a href="#">Quy định tạo gói dịch vụ (Packages)</a></li>
              <li><a href="#">Rút tiền & Tài khoản thanh toán</a></li>
              <li><a href="#">Cộng đồng Freelancer WorkGo</a></li>
              <li><a href="#">Bảo vệ quyền tác giả & sở hữu</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Về WorkGo</h4>
            <ul className={styles.linkList}>
              <li><a href="#">Giới thiệu nền tảng</a></li>
              <li><a href="#">Cơ hội nghề nghiệp</a></li>
              <li><a href="#">Báo chí & Truyền thông</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Chính sách bảo mật dữ liệu</a></li>
              <li><a href="#">Liên hệ & Trợ giúp 24/7</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.leftBottom}>
            <div className={styles.brandRow}>
              <div className={styles.footerLogoIcon}>W</div>
              <span className={styles.footerLogoText}>WorkGo</span>
            </div>
            <span className={styles.copyright}>
              © 2026 WorkGo Marketplace Inc. Nền tảng kết nối dịch vụ chuyên nghiệp hàng đầu.
            </span>
            <span className={styles.shortcutHint}>
              Mẹo bàn phím: Tab di chuyển • Esc đóng nhanh
            </span>
          </div>

          <div className={styles.rightBottom}>
            <div className={styles.localeItem}>
              <Globe size={16} />
              <span>Tiếng Việt</span>
            </div>
            <div className={styles.localeItem}>
              <span>₫ VND</span>
            </div>
            <div className={styles.localeItem}>
              <Shield size={16} />
              <span>Được bảo vệ bởi Escrow</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
