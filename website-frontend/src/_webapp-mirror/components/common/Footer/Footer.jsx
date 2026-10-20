import React from 'react';
import { Globe, Shield } from 'lucide-react';
import styles from './Footer.module.css';

import { FOOTER_COLUMNS } from './footerLinks.js';
export { FOOTER_COLUMNS };

export default function Footer({ onNavigate }) {
  const handle = (event, link) => {
    if (typeof onNavigate !== 'function') return;
    event.preventDefault();
    onNavigate(link.page, link.params || {});
  };

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
                    <a
                      href={link.params?.category ? `/vi/catalog?category=${link.params.category}` : `/vi/${link.page}`}
                      onClick={(e) => handle(e, link)}
                      className={styles.footerLink}
                    >
                      {link.label}
                    </a>
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
