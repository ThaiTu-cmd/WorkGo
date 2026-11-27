import { useTranslations } from "next-intl";
import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Loader2, Upload } from 'lucide-react';
import OrderStatusBadge from '../OrderDashboard/components/OrderStatusBadge';
import { orderApi, orderErrorMessage } from '../../api/orderApi';
import styles from './OrderCancelPage.module.css';
import { orderLabel } from '../../utils/orderNumber';
const NOTE_MIN = 20;
const NOTE_MAX = 500;
// `label` is a key of the "misc" dictionary, translated with tr() at render.
const REASONS = {
  CLIENT: [{
    code: 'CHANGED_MIND',
    label: 'm1652'
  }, {
    code: 'LATE',
    label: 'm1653'
  }, {
    code: 'QUALITY',
    label: 'm1654'
  }, {
    code: 'NO_CONTACT',
    label: 'm1655'
  }, {
    code: 'WRONG_ORDER',
    label: 'm1656'
  }, {
    code: 'OTHER',
    label: 'm1657'
  }],
  PROVIDER: [{
    code: 'OVERLOADED',
    label: 'm1658'
  }, {
    code: 'OUT_OF_SCOPE',
    label: 'm1659'
  }, {
    code: 'MISSING_INFO',
    label: 'm1660'
  }, {
    code: 'OTHER',
    label: 'm1657'
  }]
};
const formatPrice = num => new Intl.NumberFormat('vi-VN').format(num || 0) + ' ₫';

// What cancelling means for this order/role. null → cancelling is not allowed
// (order-service ErrorCode.ORDER_CANCEL_NOT_ALLOWED).
export function getCancelPolicy(order, role) {
  if (!order) return null;
  const status = order.orderStatus;
  if (role === 'PROVIDER') {
    return status === 'CONFIRMED' || status === 'IN_PROGRESS' ? {
      mode: 'request',
      paid: order.totalAmount,
      deducted: 0,
      refund: order.totalAmount
    } : null;
  }
  if (status === 'PENDING_PAYMENT') return {
    mode: 'immediate',
    paid: 0,
    deducted: 0,
    refund: 0
  };
  if (status === 'CONFIRMED') {
    return {
      mode: 'request',
      paid: order.totalAmount,
      deducted: 0,
      refund: order.totalAmount
    };
  }
  if (status === 'IN_PROGRESS') {
    if (order.cancelRequest) return null;
    return {
      mode: 'request',
      paid: order.totalAmount,
      deducted: order.platformFee,
      refund: order.subtotal
    };
  }
  return null;
}
export default function OrderCancelPage({
  order,
  role = 'CLIENT',
  onBack,
  onSubmit,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const policy = useMemo(() => getCancelPolicy(order, role), [order, role]);
  const reasons = REASONS[role] || REASONS.CLIENT;
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const isProvider = role === 'PROVIDER';
  const isRequest = policy?.mode === 'request';
  const noteRequired = isRequest || reasonCode === 'OTHER';
  const noteOk = !noteRequired || note.trim().length >= NOTE_MIN;
  const showNoteError = noteTouched && !noteOk;
  const canSubmit = Boolean(reasonCode) && noteOk && confirmed && !isSubmitting;
  const title = isProvider ? tr("m619") : isRequest ? tr("m620") : tr("m621");
  const submitLabel = isProvider ? tr("m622") : isRequest ? tr("m623") : tr("m624");
  const partnerLabel = isProvider ? tr("m625") : tr("m60");
  const subtitle = isProvider ? tr("m626") : isRequest ? tr("m627") : tr("m628");
  const handleSubmit = async e => {
    e.preventDefault();
    setNoteTouched(true);
    if (!canSubmit || !policy || isSubmitting) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      const res = await orderApi.cancelOrder(order.orderId, {
        reasonCode,
        note: note.trim() || undefined
      });
      const result = res?.result;
      if (result?.status === 'AUTO_APPROVED') {
        if (onShowToast) onShowToast(tr("m629"));
      } else {
        if (onShowToast) onShowToast(tr("m630"));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-orders-changed'));
      }
      const reason = reasons.find(r => r.code === reasonCode);
      if (onSubmit) {
        onSubmit({
          reasonCode,
          reasonLabel: reason ? tr(reason.label) : reasonCode,
          note: note.trim(),
          mode: policy.mode,
          result
        });
      }
    } catch (err) {
      const msg = orderErrorMessage(err);
      setApiError(msg);
      if (onShowToast) onShowToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  const breadcrumb = <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} />{tr("m49")}</button>
      <span className={styles.sep}>/</span>
      <span title={order?.orderNumber}>{orderLabel(order)}</span>
      <span className={styles.sep}>/</span>
      <span className={styles.current}>{isProvider ? tr("m631") : tr("m632")}</span>
    </nav>;
  if (!policy) {
    return <div>
        {breadcrumb}
        <section className={styles.blocked} role="alert">
          <AlertTriangle size={40} className={styles.blockedIcon} />
          <h1 className={styles.pageTitle}>{tr("m655")}</h1>
          <p>
            {order?.cancelRequest ? tr("m633") : tr("m634")}
          </p>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onBack}>{tr("m657")}</button>
        </section>
      </div>;
  }
  const steps = isRequest ? [{
    title: tr("m635"),
    desc: tr("m636")
  }, {
    title: tr("m637"),
    desc: tr("m638")
  }, {
    title: tr("m639"),
    desc: tr("m640")
  }] : [{
    title: tr("m641"),
    desc: tr("m642")
  }, ...(policy.paid > 0 ? [{
    title: tr("m639"),
    desc: tr("m640")
  }] : [])];
  return <div>
      {breadcrumb}
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.pageSubtitle}>{subtitle}</p>

      <div className={styles.cancelGrid}>
        {/* ===== Form ===== */}
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <fieldset className={styles.field}>
            <legend className={styles.fieldLabel}>{tr("m1503")}{isProvider ? tr("m643") : tr("m644")} <span className={styles.req}>*</span>
            </legend>
            <div className={styles.reasonList}>
              {reasons.map(r => <label key={r.code} className={`${styles.reasonCard} ${reasonCode === r.code ? styles.reasonSelected : ''}`}>
                  <input type="radio" name="cancel-reason" value={r.code} checked={reasonCode === r.code} onChange={() => setReasonCode(r.code)} />
                  <span>{tr(r.label)}</span>
                </label>)}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cancel-note">{tr("m1504")}{noteRequired ? <span className={styles.req}>*</span> : <span className={styles.optional}>{tr("m661")}</span>}
            </label>
            <textarea id="cancel-note" rows={5} maxLength={NOTE_MAX} value={note} onChange={e => setNote(e.target.value)} onBlur={() => setNoteTouched(true)} className={`${styles.textarea} ${showNoteError ? styles.textareaInvalid : ''}`} placeholder={isProvider ? tr("m645") : tr("m646", {
            p0: NOTE_MIN
          })} aria-invalid={showNoteError} aria-describedby="cancel-note-hint cancel-note-error" />
            <div className={styles.fieldFoot}>
              {showNoteError && <span id="cancel-note-error" className={styles.error}>{tr("m1505")}{NOTE_MIN}{tr("m1506")}</span>}
              <span id="cancel-note-hint" className={styles.counter}>
                {note.length}/{NOTE_MAX}
              </span>
            </div>
          </div>

          {isRequest && <div className={styles.field}>
              <span className={styles.fieldLabel}>{tr("m663")}</span>
              <label className={styles.upload}>
                <input type="file" multiple accept="image/*,.pdf" className={styles.uploadInput} />
                <Upload size={22} />
                <span>{tr("m664")}<strong>{tr("m665")}</strong>{tr("m666")}</span>
              </label>
            </div>}

          <label className={styles.confirm}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
            <span>
              {isRequest ? tr("m647") : tr("m648")}
            </span>
          </label>

          {apiError && <div className={styles.error} style={{
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          borderRadius: '6px',
          color: '#dc2626',
          marginBottom: '1rem',
          border: '1px solid #fecaca'
        }} role="alert">
              {apiError}
            </div>}

          <div className={styles.formActions}>
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onBack} disabled={isSubmitting}>{tr("m465")}</button>
            <button type="submit" className={`${styles.btn} ${styles.btnDanger}`} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <>
                  <Loader2 size={16} className={styles.spinner || ''} style={{
                display: 'inline',
                marginRight: '6px',
                animation: 'spin 1s linear infinite'
              }} />{tr("m26")}</> : submitLabel}
            </button>
          </div>
        </form>

        {/* ===== Summary ===== */}
        <aside className={styles.summary} aria-label={tr("m649")}>
          <h2 className={styles.cardTitle}>{tr("m49")}</h2>
          <div className={styles.orderHead}>
            <span className={styles.orderNo} title={order.orderNumber}>{orderLabel(order)}</span>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className={styles.svcTitle}>{order.title}</p>
          {order.counterpartName && <p className={styles.partner}>
              {partnerLabel}: <strong>{order.counterpartName}</strong>
            </p>}

          <div className={styles.refund}>
            <h3>{isProvider ? tr("m650") : tr("m651")}</h3>
            {policy.paid === 0 ? <p className={styles.refundNote}>{tr("m669")}</p> : <>
                <dl>
                  <div>
                    <dt>{tr("m670")}</dt>
                    <dd>{formatPrice(policy.paid)}</dd>
                  </div>
                  {policy.deducted > 0 && <div>
                      <dt>{tr("m671")}</dt>
                      <dd>−{formatPrice(policy.deducted)}</dd>
                    </div>}
                  <div className={styles.refundTotal}>
                    <dt>{isRequest ? tr("m652") : tr("m653")}</dt>
                    <dd>{formatPrice(policy.refund)}</dd>
                  </div>
                </dl>
                {isRequest && <p className={styles.refundNote}>{tr("m673")}</p>}
              </>}
          </div>

          <ol className={styles.timeline}>
            {steps.map((s, i) => <li key={s.title} className={i === 0 ? styles.tlActive : ''}>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </li>)}
          </ol>
        </aside>
      </div>
    </div>;
}