import React from 'react';
import { Globe, Shield } from 'lucide-react';
import { FOOTER_COLUMNS } from './footerLinks.js';
import styles from './Footer.module.css';

export default function Footer({ onNavigate }) {
  const go = (page, params = {}) => {
    if (typeof onNavigate !== 'function') return;
    onNavigate(page, params);
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          {/* Brand column */}
          <div className={styles.brandCol}>
            <button
              type="button"
              className={styles.footerLogo}
              aria-label="WorkGo — về trang chủ"
              onClick={() => go('home')}
            >
              WorkGo
            </button>
            <p className={styles.brandDesc}>
              Nền tảng kết nối khách hàng với chuyên gia và freelancer uy tín — thanh toán an toàn qua ký quỹ.
            </p>
            <span className={styles.escrowBadge}>
              <Shield size={15} />
              Được bảo vệ bởi Escrow
            </span>
            <span className={styles.shortcutHint}>
              Mẹo bàn phím: Tab di chuyển • Esc đóng nhanh
            </span>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className={styles.col}>
              <h4 className={styles.colTitle}>{col.title}</h4>
              <ul className={styles.linkList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      className={styles.footerLink}
                      onClick={() => go(link.page, link.params)}
                    >
                      {link.label}
                    </button>
                  </li>
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
            <span className={styles.localeItemStatic}>
              <Globe size={16} />
              <span>Tiếng Việt</span>
            </span>
            <span className={styles.localeItemStatic}>
              <span>₫ VND</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
