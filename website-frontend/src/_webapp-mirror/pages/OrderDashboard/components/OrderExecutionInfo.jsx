import React, { useEffect, useState } from 'react';
import { orderApi } from '../../../api/orderApi';
import styles from './OrderExecutionInfo.module.css';

const DIGITAL_STATUS = {
  AWAITING_REQUIREMENTS: 'Chờ khách gửi yêu cầu',
  WORKING: 'Đang thực hiện',
  SUBMITTED: 'Đã bàn giao, chờ nghiệm thu',
  REVISING: 'Đang chỉnh sửa',
  ACCEPT: 'Đã nghiệm thu',
  CANCELLED: 'Đã hủy',
};

const formatDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
    : '—';

// Read-only execution progress from order-service (GET /orders/{id}/execution).
// Loaded when the order row is expanded; there are no execution actions yet.
export default function OrderExecutionInfo({ orderId }) {
  const [state, setState] = useState({ status: 'loading', execution: null });

  useEffect(() => {
    let cancelled = false;
    orderApi.getExecution(orderId).then(
      (res) => {
        if (!cancelled) setState({ status: 'ready', execution: res?.result ?? null });
      },
      (err) => {
        if (!cancelled) setState({ status: err?.status === 404 ? 'none' : 'error', execution: null });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (state.status === 'loading') return <p className={styles.muted}>Đang tải tiến độ thực hiện...</p>;
  if (state.status === 'none' || !state.execution) {
    return state.status === 'error' ? (
      <p className={styles.muted}>Không tải được tiến độ thực hiện.</p>
    ) : null;
  }

  const { executionType, digital, onsite } = state.execution;
  return (
    <div className={styles.box}>
      <strong className={styles.title}>Tiến độ thực hiện</strong>
      {executionType === 'DIGITAL' && digital && (
        <dl className={styles.list}>
          <div>
            <dt>Trạng thái</dt>
            <dd>{DIGITAL_STATUS[digital.status] || digital.status}</dd>
          </div>
          <div>
            <dt>Hạn bàn giao</dt>
            <dd>{formatDateTime(digital.deadlineAt)}</dd>
          </div>
          <div>
            <dt>Lượt chỉnh sửa</dt>
            <dd>
              {digital.revisionsUsed ?? 0}
              {digital.revisionLimit != null ? ` / ${digital.revisionLimit}` : ''}
            </dd>
          </div>
        </dl>
      )}
      {executionType === 'ONSITE' && onsite && (
        <dl className={styles.list}>
          <div>
            <dt>Trạng thái</dt>
            <dd>{onsite.status}</dd>
          </div>
          <div>
            <dt>Lịch hẹn</dt>
            <dd>{formatDateTime(onsite.scheduledStart)}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{onsite.addressSnapshot || '—'}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
