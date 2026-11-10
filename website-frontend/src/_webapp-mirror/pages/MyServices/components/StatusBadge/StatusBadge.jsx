import React from 'react';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Đang hoạt động',
          className: styles.badgeActive,
          dotClass: styles.dotActive,
        };
      case 'PENDING':
        return {
          label: 'Chờ duyệt',
          className: styles.badgePending,
          dotClass: styles.dotPending,
        };
      case 'PAUSED':
        return {
          label: 'Tạm ngưng',
          className: styles.badgePaused,
          dotClass: styles.dotPaused,
        };
      case 'DRAFT':
        return {
          label: 'Bản nháp',
          className: styles.badgeDraft,
          dotClass: styles.dotDraft,
        };
      case 'REJECTED':
        return {
          label: 'Bị từ chối',
          className: styles.badgeRejected,
          dotClass: styles.dotRejected,
        };
      default:
        return {
          label: status,
          className: styles.badgeDefault,
          dotClass: styles.dotDefault,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`${styles.badge} ${config.className}`}>
      <span className={`${styles.dot} ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
}
