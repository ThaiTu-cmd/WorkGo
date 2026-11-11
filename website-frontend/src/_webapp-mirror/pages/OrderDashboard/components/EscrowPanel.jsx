import { useTranslations } from "next-intl";
import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { paymentApi, paymentErrorMessage } from '../../../api/paymentApi';
import styles from './OrderFlow.module.css';

// Keys of the "misc" dictionary (tr() at render).
const STATUS_LABELS = {
  PENDING: 'm1741',
  HOLDING: 'm1742',
  RELEASED: 'm1743',
  REFUNDED: 'm1744',
  PARTIALLY_REFUNDED: 'm1745',
  FROZEN: 'm1746'
};
const TXN_LABELS = {
  HOLD: 'm1752',
  FEE: 'm716',
  RELEASE: 'm1753',
  REFUND: 'm1754',
  PARTIAL_REFUND: 'm1755',
  FREEZE: 'm1756',
  UNFREEZE: 'm1757'
};
const ESCROW_NOT_FOUND = 3101;
const formatPrice = num => new Intl.NumberFormat('vi-VN').format(Number(num) || 0) + ' ₫';
const formatDateTime = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(iso)) : '—';
const positive = value => Number(value) > 0;

// Money of a paid order as payment-service holds it (GET /payment/escrows/orders/{id}):
// held until the client accepts the work, then released to the provider, or refunded on cancel.
export default function EscrowPanel({
  orderId,
  role
}) {
  const tr = useTranslations("misc");
  const [state, setState] = useState({
    status: 'loading',
    escrow: null,
    error: null
  });
  useEffect(() => {
    let cancelled = false;
    paymentApi.getEscrow(orderId).then(res => {
      if (!cancelled) setState({
        status: 'ready',
        escrow: res?.result ?? null,
        error: null
      });
    }, err => {
      if (!cancelled) setState({
        status: 'error',
        escrow: null,
        error: err
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);
  const {
    status,
    escrow,
    error
  } = state;
  const title = <strong className={styles.panelTitle}>
      <ShieldCheck size={16} aria-hidden="true" />{tr("m1740")}
      {escrow?.status && <span className={`${styles.chip} ${styles[`escrow_${escrow.status}`] || ''}`}>
          {STATUS_LABELS[escrow.status] ? tr(STATUS_LABELS[escrow.status]) : escrow.status}
        </span>}
    </strong>;
  if (status === 'loading') {
    return <section className={styles.panel} aria-label={tr("m1740")}>
        {title}
        <Loader2 size={18} className={styles.spin} aria-label={tr("m1740")} />
      </section>;
  }
  if (status === 'error' || !escrow) {
    return <section className={styles.panel} aria-label={tr("m1740")}>
        {title}
        <p className={styles.note}>
          {error?.code === ESCROW_NOT_FOUND || !error ? tr("m1758") : tr("m1759", {
          p0: paymentErrorMessage(error)
        })}
        </p>
      </section>;
  }
  const note = escrow.status === 'HOLDING' ? role === 'PROVIDER' ? tr("m1750", {
    p0: formatPrice(escrow.providerNetAmount)
  }) : tr("m1749") : escrow.status === 'FROZEN' ? tr("m1751") : null;
  const transactions = [...(escrow.transactions ?? [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  // releasedAmount counts the platform fee too; the RELEASE entries are what the expert got.
  const releaseTxns = transactions.filter(txn => txn.txnType === 'RELEASE');
  const paidToExpert = releaseTxns.length > 0 ? releaseTxns.reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0) : escrow.providerNetAmount;
  return <section className={styles.panel} aria-label={tr("m1740")}>
      {title}
      <dl className={styles.escrowList}>
        <div>
          <dt>{tr("m1747")}</dt>
          <dd>{formatPrice(escrow.heldAmount)}</dd>
        </div>
        <div>
          <dt>{tr("m716")}</dt>
          <dd>{formatPrice(escrow.platformFeeAmount)}</dd>
        </div>
        <div>
          <dt>{tr("m878")}</dt>
          <dd>{formatPrice(escrow.providerNetAmount)}</dd>
        </div>
        {positive(escrow.releasedAmount) && <div>
            <dt>{tr("m1748", {
            p0: formatDateTime(escrow.releasedAt)
          })}</dt>
            <dd>{formatPrice(paidToExpert)}</dd>
          </div>}
        {positive(escrow.refundedAmount) && <div>
            <dt>{tr("m1760", {
            p0: formatDateTime(escrow.refundedAt)
          })}</dt>
            <dd>{formatPrice(escrow.refundedAmount)}</dd>
          </div>}
      </dl>
      {note && <p className={styles.note}>{note}</p>}
      {transactions.length > 0 && <>
          <strong className={styles.panelTitle}>{tr("m1761")}</strong>
          <ul className={styles.escrowTxns}>
            {transactions.map(txn => <li key={txn.escrowTransactionId}>
                <span>{TXN_LABELS[txn.txnType] ? tr(TXN_LABELS[txn.txnType]) : txn.txnType}</span>
                <strong>{formatPrice(txn.amount)}</strong>
                <small>{formatDateTime(txn.createdAt)}</small>
              </li>)}
          </ul>
        </>}
    </section>;
}
