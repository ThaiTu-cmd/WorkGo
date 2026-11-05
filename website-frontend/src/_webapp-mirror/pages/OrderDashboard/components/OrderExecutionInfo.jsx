import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
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

export const ONSITE_STATUS = {
  SCHEDULED: 'Đã lên lịch',
  IN_SERVICE: 'Đang thực hiện tại nhà',
  SERVICE_DONE: 'Đã làm xong, chờ nghiệm thu',
  ACCEPT: 'Đã nghiệm thu',
  CANCELLED: 'Đã hủy',
};

const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã bàn giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const ROLE_LABELS = {
  CLIENT: 'Khách hàng',
  PROVIDER: 'Chuyên gia',
  SYSTEM: 'Hệ thống',
  ADMIN: 'Quản trị viên',
};

const formatDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
    : '—';

export default function OrderExecutionInfo({ state, order, role, onShowToast }) {
  const [cancellation, setCancellation] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [responding, setResponding] = useState(false);

  const orderId = order?.orderId;

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    // Fetch cancellation details
    orderApi
      .getCancellation(orderId)
      .then((res) => {
        if (!cancelled && res?.result) {
          setCancellation(res.result);
        }
      })
      .catch(() => {
        if (!cancelled) setCancellation(null);
      });

    // Fetch order status history
    orderApi
      .getOrderHistory(orderId, 0, 50)
      .then((res) => {
        const list = res?.result?.data || (Array.isArray(res?.result) ? res.result : []);
        if (!cancelled && Array.isArray(list)) {
          setOrderHistory(list);
        }
      })
      .catch(() => {
        if (!cancelled) setOrderHistory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleRespondCancellation = async (accept) => {
    if (responding || !orderId) return;
    setResponding(true);
    try {
      const res = await orderApi.respondCancellation(orderId, { accept });
      setCancellation(res?.result || null);
      if (onShowToast) {
        onShowToast(accept ? 'Đã chấp thuận yêu cầu hủy đơn.' : 'Đã từ chối yêu cầu hủy đơn.');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-orders-changed'));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Lỗi: ${err?.message || 'Không thể phản hồi yêu cầu hủy.'}`);
      }
    } finally {
      setResponding(false);
    }
  };

  const isCounterpart = cancellation && cancellation.requestedByRole !== role;

  return (
    <div className={styles.box}>
      {/* Cancellation Banner */}
      {cancellation && (
        <div
          style={{
            padding: '12px 14px',
            marginBottom: '14px',
            borderRadius: '6px',
            border: cancellation.status === 'PENDING' ? '1px solid #f59e0b' : '1px solid #e2e8f0',
            backgroundColor: cancellation.status === 'PENDING' ? '#fffbeb' : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <AlertCircle size={18} color={cancellation.status === 'PENDING' ? '#d97706' : '#64748b'} />
            <strong style={{ fontSize: '0.9rem', color: cancellation.status === 'PENDING' ? '#b45309' : '#334155' }}>
              {cancellation.status === 'PENDING'
                ? 'Yêu cầu hủy đơn hàng đang chờ phản hồi'
                : cancellation.status === 'ACCEPTED' || cancellation.status === 'AUTO_APPROVED'
                ? 'Đơn hàng đã được hủy'
                : 'Yêu cầu hủy đơn đã bị từ chối'}
            </strong>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
            <p style={{ margin: '2px 0' }}>
              <strong>Người gửi yêu cầu:</strong>{' '}
              {cancellation.requestedByRole === 'CLIENT' ? 'Khách hàng' : 'Chuyên gia'}
            </p>
            <p style={{ margin: '2px 0' }}>
              <strong>Lý do:</strong> {cancellation.reasonCode}
            </p>
            {cancellation.note && (
              <p style={{ margin: '2px 0' }}>
                <strong>Ghi chú:</strong> {cancellation.note}
              </p>
            )}
            <p style={{ margin: '2px 0' }}>
              <strong>Thời gian gửi:</strong> {formatDateTime(cancellation.createdAt)}
            </p>
          </div>

          {cancellation.status === 'PENDING' && (
            <div style={{ marginTop: '10px' }}>
              {isCounterpart ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => handleRespondCancellation(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '4px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {responding ? 'Đang xử lý...' : 'Đồng ý hủy đơn'}
                  </button>
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => handleRespondCancellation(false)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {responding ? 'Đang xử lý...' : 'Từ chối hủy đơn'}
                  </button>
                </div>
              ) : (
                <p style={{ margin: '6px 0 0 0', fontStyle: 'italic', color: '#64748b', fontSize: '0.82rem' }}>
                  Đang chờ đối phương xem xét và phản hồi yêu cầu của bạn.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Execution Status */}
      {state.status === 'loading' && <p className={styles.muted}>Đang tải tiến độ thực hiện...</p>}
      {state.status !== 'loading' && state.execution && (
        <>
          <strong className={styles.title}>Tiến độ thực hiện</strong>
          {state.execution.executionType === 'DIGITAL' && state.execution.digital && (
            <dl className={styles.list}>
              <div>
                <dt>Trạng thái thực thi</dt>
                <dd>{DIGITAL_STATUS[state.execution.digital.status] || state.execution.digital.status}</dd>
              </div>
              <div>
                <dt>Hạn bàn giao</dt>
                <dd>{formatDateTime(state.execution.digital.deadlineAt)}</dd>
              </div>
              <div>
                <dt>Lượt chỉnh sửa</dt>
                <dd>
                  {state.execution.digital.revisionsUsed ?? 0}
                  {state.execution.digital.revisionLimit != null ? ` / ${state.execution.digital.revisionLimit}` : ''}
                </dd>
              </div>
            </dl>
          )}
          {state.execution.executionType === 'ONSITE' && state.execution.onsite && (
            <dl className={styles.list}>
              <div>
                <dt>Trạng thái thực thi</dt>
                <dd>{ONSITE_STATUS[state.execution.onsite.status] || state.execution.onsite.status}</dd>
              </div>
              <div>
                <dt>Lịch hẹn</dt>
                <dd>{formatDateTime(state.execution.onsite.scheduledStart)}</dd>
              </div>
              <div>
                <dt>Địa chỉ thực hiện</dt>
                <dd>{state.execution.onsite.addressSnapshot || '—'}</dd>
              </div>
              {state.execution.onsite.arrivedAt && (
                <div>
                  <dt>Thời gian có mặt</dt>
                  <dd>{formatDateTime(state.execution.onsite.arrivedAt)}</dd>
                </div>
              )}
              {state.execution.onsite.serviceCompletedAt && (
                <div>
                  <dt>Thời gian hoàn thành</dt>
                  <dd>{formatDateTime(state.execution.onsite.serviceCompletedAt)}</dd>
                </div>
              )}
            </dl>
          )}
        </>
      )}

      {/* Order Status History Timeline */}
      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--wg-border, #e2e8f0)' }}>
        <strong className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Clock size={15} /> Nhật ký trạng thái đơn hàng {orderHistory.length > 0 ? `(${orderHistory.length})` : ''}
        </strong>
        {orderHistory.length === 0 ? (
          <p style={{ margin: '6px 0', fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Chưa có sự kiện chuyển đổi trạng thái nào được ghi nhận.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orderHistory.map((hist, idx) => (
              <div
                key={hist.orderStatusHistoryId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {ROLE_LABELS[hist.roleName] || hist.roleName || 'Hệ thống'}
                  </span>
                  <span style={{ color: '#64748b' }}>
                    {ORDER_STATUS_LABELS[hist.fromStatus] || hist.fromStatus || 'Khởi tạo'}
                  </span>
                  <span style={{ color: '#94a3b8' }}>➔</span>
                  <strong style={{ color: '#0f172a' }}>
                    {ORDER_STATUS_LABELS[hist.toStatus] || hist.toStatus}
                  </strong>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {formatDateTime(hist.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
