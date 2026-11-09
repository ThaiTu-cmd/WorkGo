import { useTranslations } from "next-intl";
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import { orderApi } from '../../../api/orderApi';
import styles from './OrderExecutionInfo.module.css';
const DIGITAL_STATUS = {
  AWAITING_REQUIREMENTS: "Wait for the customer to send a request",
  WORKING: "Ongoing",
  SUBMITTED: "Handed over, waiting for acceptance",
  REVISING: "Editing",
  ACCEPT: "Accepted",
  CANCELLED: "Canceled"
};
export const ONSITE_STATUS = {
  SCHEDULED: "Scheduled",
  IN_SERVICE: "Doing it at home",
  SERVICE_DONE: "Done, waiting for acceptance",
  ACCEPT: "Accepted",
  CANCELLED: "Canceled"
};
const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: "Wait for payment",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "Ongoing",
  DELIVERED: "Handed over",
  COMPLETED: "Completed",
  CANCELLED: "Canceled"
};
const ROLE_LABELS = {
  CLIENT: "Client",
  PROVIDER: "Expert",
  SYSTEM: "System",
  ADMIN: "Administrator"
};
const formatDateTime = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
}).format(new Date(iso)) : '—';
export default function OrderExecutionInfo({
  state,
  order,
  role,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const [cancellation, setCancellation] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [responding, setResponding] = useState(false);
  const orderId = order?.orderId;
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    // Fetch cancellation details
    orderApi.getCancellation(orderId).then(res => {
      if (!cancelled && res?.result) {
        setCancellation(res.result);
      }
    }).catch(() => {
      if (!cancelled) setCancellation(null);
    });

    // Fetch order status history
    orderApi.getOrderHistory(orderId, 0, 50).then(res => {
      const list = res?.result?.data || (Array.isArray(res?.result) ? res.result : []);
      if (!cancelled && Array.isArray(list)) {
        setOrderHistory(list);
      }
    }).catch(() => {
      if (!cancelled) setOrderHistory([]);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);
  const handleRespondCancellation = async accept => {
    if (responding || !orderId) return;
    setResponding(true);
    try {
      const res = await orderApi.respondCancellation(orderId, {
        accept
      });
      setCancellation(res?.result || null);
      if (onShowToast) {
        onShowToast(accept ? tr("m735") : tr("m736"));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-orders-changed'));
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(tr("m737", {
          p0: err?.message || tr("m1512")
        }));
      }
    } finally {
      setResponding(false);
    }
  };
  const isCounterpart = cancellation && cancellation.requestedByRole !== role;
  return <div className={styles.box}>
      {/* Cancellation Banner */}
      {cancellation && <div style={{
      padding: '12px 14px',
      marginBottom: '14px',
      borderRadius: '6px',
      border: cancellation.status === 'PENDING' ? '1px solid #f59e0b' : '1px solid #e2e8f0',
      backgroundColor: cancellation.status === 'PENDING' ? '#fffbeb' : '#f8fafc'
    }}>
          <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px'
      }}>
            <AlertCircle size={18} color={cancellation.status === 'PENDING' ? '#d97706' : '#64748b'} />
            <strong style={{
          fontSize: '0.9rem',
          color: cancellation.status === 'PENDING' ? '#b45309' : '#334155'
        }}>
              {cancellation.status === 'PENDING' ? tr("m738") : cancellation.status === 'ACCEPTED' || cancellation.status === 'AUTO_APPROVED' ? tr("m739") : tr("m740")}
            </strong>
          </div>
          <div style={{
        fontSize: '0.82rem',
        color: '#475569',
        lineHeight: 1.5
      }}>
            <p style={{
          margin: '2px 0'
        }}>
              <strong>{tr("m746")}</strong>{' '}
              {cancellation.requestedByRole === 'CLIENT' ? tr("m625") : tr("m60")}
            </p>
            <p style={{
          margin: '2px 0'
        }}>
              <strong>{tr("m748")}</strong> {cancellation.reasonCode}
            </p>
            {cancellation.note && <p style={{
          margin: '2px 0'
        }}>
                <strong>{tr("m749")}</strong> {cancellation.note}
              </p>}
            <p style={{
          margin: '2px 0'
        }}>
              <strong>{tr("m750")}</strong> {formatDateTime(cancellation.createdAt)}
            </p>
          </div>

          {cancellation.status === 'PENDING' && <div style={{
        marginTop: '10px'
      }}>
              {isCounterpart ? <div style={{
          display: 'flex',
          gap: '10px'
        }}>
                  <button type="button" disabled={responding} onClick={() => handleRespondCancellation(true)} style={{
            padding: '6px 14px',
            borderRadius: '4px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
                    {responding ? tr("m26") : tr("m741")}
                  </button>
                  <button type="button" disabled={responding} onClick={() => handleRespondCancellation(false)} style={{
            padding: '6px 14px',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
                    {responding ? tr("m26") : tr("m742")}
                  </button>
                </div> : <p style={{
          margin: '6px 0 0 0',
          fontStyle: 'italic',
          color: '#64748b',
          fontSize: '0.82rem'
        }}>{tr("m753")}</p>}
            </div>}
        </div>}

      {/* Main Execution Status */}
      {state.status === 'loading' && <p className={styles.muted}>{tr("m754")}</p>}
      {state.status !== 'loading' && state.execution && <>
          <strong className={styles.title}>{tr("m755")}</strong>
          {state.execution.executionType === 'DIGITAL' && state.execution.digital && <dl className={styles.list}>
              <div>
                <dt>{tr("m756")}</dt>
                <dd>{DIGITAL_STATUS[state.execution.digital.status] || state.execution.digital.status}</dd>
              </div>
              <div>
                <dt>{tr("m757")}</dt>
                <dd>{formatDateTime(state.execution.digital.deadlineAt)}</dd>
              </div>
              <div>
                <dt>{tr("m758")}</dt>
                <dd>
                  {state.execution.digital.revisionsUsed ?? 0}
                  {state.execution.digital.revisionLimit != null ? ` / ${state.execution.digital.revisionLimit}` : ''}
                </dd>
              </div>
            </dl>}
          {state.execution.executionType === 'ONSITE' && state.execution.onsite && <dl className={styles.list}>
              <div>
                <dt>{tr("m756")}</dt>
                <dd>{ONSITE_STATUS[state.execution.onsite.status] || state.execution.onsite.status}</dd>
              </div>
              <div>
                <dt>{tr("m83")}</dt>
                <dd>{formatDateTime(state.execution.onsite.scheduledStart)}</dd>
              </div>
              <div>
                <dt>{tr("m518")}</dt>
                <dd>{state.execution.onsite.addressSnapshot || '—'}</dd>
              </div>
              {state.execution.onsite.arrivedAt && <div>
                  <dt>{tr("m759")}</dt>
                  <dd>{formatDateTime(state.execution.onsite.arrivedAt)}</dd>
                </div>}
              {state.execution.onsite.serviceCompletedAt && <div>
                  <dt>{tr("m422")}</dt>
                  <dd>{formatDateTime(state.execution.onsite.serviceCompletedAt)}</dd>
                </div>}
            </dl>}
        </>}

      {/* Order Status History Timeline */}
      <div style={{
      marginTop: '16px',
      paddingTop: '14px',
      borderTop: '1px solid var(--wg-border, #e2e8f0)'
    }}>
        <strong className={styles.title} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px'
      }}>
          <Clock size={15} />{tr("m1513")}{orderHistory.length > 0 ? `(${orderHistory.length})` : ''}
        </strong>
        {orderHistory.length === 0 ? <p style={{
        margin: '6px 0',
        fontSize: '0.82rem',
        color: '#94a3b8',
        fontStyle: 'italic'
      }}>{tr("m760")}</p> : <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
            {orderHistory.map((hist, idx) => <div key={hist.orderStatusHistoryId || idx} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          fontSize: '0.82rem'
        }}>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
                  <span style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
                    {ROLE_LABELS[hist.roleName] || hist.roleName || tr("m733")}
                  </span>
                  <span style={{
              color: '#64748b'
            }}>
                    {ORDER_STATUS_LABELS[hist.fromStatus] || hist.fromStatus || tr("m743")}
                  </span>
                  <span style={{
              color: '#94a3b8'
            }}>➔</span>
                  <strong style={{
              color: '#0f172a'
            }}>
                    {ORDER_STATUS_LABELS[hist.toStatus] || hist.toStatus}
                  </strong>
                </div>
                <span style={{
            color: '#64748b',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap'
          }}>
                  {formatDateTime(hist.createdAt)}
                </span>
              </div>)}
          </div>}
      </div>
    </div>;
}