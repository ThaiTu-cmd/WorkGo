import React from 'react';
import styles from './OrderStatusBadge.module.css';

// Labels for order-service OrderStatus.
export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã bàn giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const CLASS_BY_STATUS = {
  PENDING_PAYMENT: styles.pending,
  CONFIRMED: styles.confirmed,
  IN_PROGRESS: styles.progress,
  DELIVERED: styles.delivered,
  COMPLETED: styles.completed,
  CANCELLED: styles.cancelled,
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${CLASS_BY_STATUS[status] || styles.cancelled}`}>
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}
