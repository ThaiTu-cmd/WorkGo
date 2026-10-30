import React from 'react';
import styles from './NotFoundPage.module.css';

/**
 * NotFoundPage: Hiển thị khi người dùng truy cập route không tồn tại hoặc trang chưa hỗ trợ.
 * Đảm bảo người dùng không gặp màn hình trắng và luôn có lối thoát về Home/Catalog.
 */
export default function NotFoundPage({ requestedKey = '', onNavigate }) {
  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBadge}>404</div>
        <h1 className={styles.title}>Không tìm thấy trang yêu cầu</h1>
        <p className={styles.description}>
          Trang bạn đang tìm kiếm không tồn tại hoặc nội dung đang được cập nhật trong phiên bản tiếp theo.
        </p>
        {requestedKey && (
          <div className={styles.keyInfo}>
            <span className={styles.keyLabel}>Đường dẫn yêu cầu:</span>
            <code className={styles.keyCode}>{requestedKey}</code>
          </div>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={styles.btnPrimary}
          >
            Về Trang chủ
          </button>
          <button
            type="button"
            onClick={() => navigateTo('catalog')}
            className={styles.btnSecondary}
          >
            Khám phá dịch vụ
          </button>
        </div>
      </div>
    </div>
  );
}
