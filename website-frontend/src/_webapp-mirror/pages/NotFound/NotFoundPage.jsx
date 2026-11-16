import { useTranslations } from "next-intl";
import React from 'react';
import styles from './NotFoundPage.module.css';

/**
 * NotFoundPage: Hiển thị khi người dùng truy cập route không tồn tại hoặc trang chưa hỗ trợ.
 * Đảm bảo người dùng không gặp màn hình trắng và luôn có lối thoát về Home/Catalog.
 */
export default function NotFoundPage({
  requestedKey = '',
  onNavigate
}) {
  const tr = useTranslations("misc");
  const navigateTo = page => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };
  return <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBadge}>404</div>
        <h1 className={styles.title}>{tr("m606")}</h1>
        <p className={styles.description}>{tr("m607")}</p>
        {requestedKey && <div className={styles.keyInfo}>
            <span className={styles.keyLabel}>{tr("m608")}</span>
            <code className={styles.keyCode}>{requestedKey}</code>
          </div>}
        <div className={styles.actions}>
          <button type="button" onClick={() => navigateTo('home')} className={styles.btnPrimary}>{tr("m241")}</button>
          <button type="button" onClick={() => navigateTo('catalog')} className={styles.btnSecondary}>{tr("m609")}</button>
        </div>
      </div>
    </div>;
}