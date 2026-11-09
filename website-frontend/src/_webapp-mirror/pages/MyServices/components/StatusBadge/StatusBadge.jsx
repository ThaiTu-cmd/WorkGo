import { useTranslations } from "next-intl";
import React from 'react';
import styles from './StatusBadge.module.css';
export default function StatusBadge({
  status
}) {
  const tr = useTranslations("misc");
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: tr("m582"),
          className: styles.badgeActive,
          dotClass: styles.dotActive
        };
      case 'PENDING':
        return {
          label: tr("m222"),
          className: styles.badgePending,
          dotClass: styles.dotPending
        };
      case 'PAUSED':
        return {
          label: tr("m559"),
          className: styles.badgePaused,
          dotClass: styles.dotPaused
        };
      case 'DRAFT':
        return {
          label: tr("m560"),
          className: styles.badgeDraft,
          dotClass: styles.dotDraft
        };
      case 'REJECTED':
        return {
          label: tr("m583"),
          className: styles.badgeRejected,
          dotClass: styles.dotRejected
        };
      default:
        return {
          label: status,
          className: styles.badgeDefault,
          dotClass: styles.dotDefault
        };
    }
  };
  const config = getStatusConfig();
  return <span className={`${styles.badge} ${config.className}`}>
      <span className={`${styles.dot} ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>;
}