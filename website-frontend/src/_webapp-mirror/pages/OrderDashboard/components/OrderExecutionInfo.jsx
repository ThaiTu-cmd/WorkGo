import { useTranslations } from "next-intl";
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import { orderApi } from '../../../api/orderApi';
import styles from './OrderExecutionInfo.module.css';
// Label maps hold keys of the "misc" dictionary, translated with tr() at render.
const DIGITAL_STATUS = {
  AWAITING_REQUIREMENTS: 'm1594',
  WORKING: 'm1576',
  SUBMITTED: 'm1609',
  REVISING: 'm1610',
  ACCEPT: 'm1602',
  CANCELLED: 'm1579'
};
export const ONSITE_STATUS = {
  SCHEDULED: 'm1611',
  IN_SERVICE: 'm1612',
  SERVICE_DONE: 'm1613',
  ACCEPT: 'm1602',
  CANCELLED: 'm1579'
};
const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'm1574',
  CONFIRMED: 'm1575',
  IN_PROGRESS: 'm1576',
  DELIVERED: 'm1577',
  COMPLETED: 'm1578',
  CANCELLED: 'm1579'
};
const ROLE_LABELS = {
  CLIENT: 'm1614',
  PROVIDER: 'm1615',
  SYSTEM: 'm1616',
  ADMIN: 'm1617'
};
// Translated label for `value` from one of the maps above (raw value if unknown).
const labelOf = (tr, map, value) => map[value] ? tr(map[value]) : value;
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
      border: cancellation.status === 'PENDING' ? '1px solid #f59e0b' : '1px solid var(--wg-border)',
      // Translucent amber / theme surface: the text inside uses theme colors.
      backgroundColor: cancellation.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'var(--wg-surface-alt)'
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
          color: cancellation.status === 'PENDING' ? '#d97706' : 'var(--wg-text-secondary)'
        }}>
              {cancellation.status === 'PENDING' ? tr("m738") : cancellation.status === 'ACCEPTED' || cancellation.status === 'AUTO_APPROVED' ? tr("m739") : tr("m740")}
            </strong>
          </div>
          <div style={{
        fontSize: '0.82rem',
        color: 'var(--wg-text-secondary)',
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
            backgroundColor: 'var(--wg-surface)',
            color: 'var(--wg-text-secondary)',
            border: '1px solid var(--wg-border)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
                    {responding ? tr("m26") : tr("m742")}
                  </button>
                </div> : <p style={{
          margin: '6px 0 0 0',
          fontStyle: 'italic',
          color: 'var(--wg-text-muted)',
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
                <dd>{labelOf(tr, DIGITAL_STATUS, state.execution.digital.status)}</dd>
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
                <dd>{labelOf(tr, ONSITE_STATUS, state.execution.onsite.status)}</dd>
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
        color: 'var(--wg-text-muted)',
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
          backgroundColor: 'var(--wg-surface)',
          border: '1px solid var(--wg-border)',
          fontSize: '0.82rem'
        }}>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
                  <span style={{
              backgroundColor: 'var(--wg-surface-alt)',
              color: 'var(--wg-text-secondary)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
                    {labelOf(tr, ROLE_LABELS, hist.roleName) || tr("m733")}
                  </span>
                  <span style={{
              color: 'var(--wg-text-muted)'
            }}>
                    {labelOf(tr, ORDER_STATUS_LABELS, hist.fromStatus) || tr("m743")}
                  </span>
                  <span style={{
              color: 'var(--wg-text-muted)'
            }}>➔</span>
                  <strong style={{
              color: 'var(--wg-text)'
            }}>
                    {labelOf(tr, ORDER_STATUS_LABELS, hist.toStatus)}
                  </strong>
                </div>
                <span style={{
            color: 'var(--wg-text-muted)',
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