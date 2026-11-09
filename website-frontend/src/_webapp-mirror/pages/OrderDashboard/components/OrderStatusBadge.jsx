import { useTranslations } from "next-intl";
import React from 'react';
import styles from './OrderStatusBadge.module.css';

// Labels for order-service OrderStatus.
export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: "Wait for payment",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "Ongoing",
  DELIVERED: "Handed over",
  COMPLETED: "Completed",
  CANCELLED: "Canceled"
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
      {ORDER_STATUS_LABELS[status] || status}
    </span>;
}