import { useTranslations } from "next-intl";
import React from 'react';
import styles from './OrderStatusBadge.module.css';

// Labels for order-service OrderStatus (keys of the "misc" dictionary).
export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'm1574',
  CONFIRMED: 'm1575',
  IN_PROGRESS: 'm1576',
  DELIVERED: 'm1577',
  COMPLETED: 'm1578',
  CANCELLED: 'm1579'
};
const CLASS_BY_STATUS = {
  PENDING_PAYMENT: styles.pending,
  CONFIRMED: styles.confirmed,
  IN_PROGRESS: styles.progress,
  DELIVERED: styles.delivered,
  COMPLETED: styles.completed,
  CANCELLED: styles.cancelled
};
export default function OrderStatusBadge({
  status
}) {
  const tr = useTranslations("misc");
  return <span className={`${styles.badge} ${CLASS_BY_STATUS[status] || styles.cancelled}`}>
      {ORDER_STATUS_LABELS[status] ? tr(ORDER_STATUS_LABELS[status]) : status}
    </span>;
}