import React from 'react';
import styles from './OrderExecutionInfo.module.css';

const DIGITAL_STATUS = {
  AWAITING_REQUIREMENTS: 'Chờ khách gửi yêu cầu',
  WORKING: 'Đang thực hiện',
  SUBMITTED: 'Đã bàn giao, chờ nghiệm thu',
  REVISING: 'Đang chỉnh sửa',
  ACCEPT: 'Đã nghiệm thu',
  CANCELLED: 'Đã hủy',
};

export const ONSITE_STATUS = {
  SCHEDULED: 'Đã lên lịch',
  IN_SERVICE: 'Đang thực hiện tại nhà',
  SERVICE_DONE: 'Đã làm xong, chờ nghiệm thu',
  ACCEPT: 'Đã nghiệm thu',
  CANCELLED: 'Đã hủy',
};

const formatDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
    : '—';

// Read-only execution progress from order-service (GET /orders/{id}/execution).
// `state` comes from useOrderExecution, loaded when the order row is expanded.
export default function OrderExecutionInfo({ state }) {
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
            <dd>{ONSITE_STATUS[onsite.status] || onsite.status}</dd>
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
