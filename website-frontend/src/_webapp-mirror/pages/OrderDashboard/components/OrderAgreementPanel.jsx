import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { orderApi, orderErrorMessage } from '../../../api/orderApi';
import OrderFlowDialog from './OrderFlowDialog';
import buttons from './WorkEvidence.module.css';
import styles from './OrderFlow.module.css';

function AmendmentDialog({ order, onClose, onDone }) {
  const t = useTranslations('orderWorkspace');
  const [scope, setScope] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const canChangePrice = order.orderStatus !== 'PENDING_PAYMENT';
  const canChangeDuration = order.executionType === 'DIGITAL';
  const newPrice = canChangePrice && price ? Number(price) : undefined;
  const newDurationDays = canChangeDuration && duration ? Number(duration) : undefined;
  const validPrice = newPrice == null || (Number.isSafeInteger(newPrice) && newPrice > 0);
  const validDuration = newDurationDays == null || (Number.isInteger(newDurationDays) && newDurationDays > 0 && newDurationDays <= 2147483647);
  const canSubmit = reason.trim() && (scope.trim() || newPrice || newDurationDays) && validPrice && validDuration;
  return <OrderFlowDialog title={t('propose')} submitLabel={t('propose')} canSubmit={!!canSubmit} onClose={onClose} onSubmit={async () => {
    await orderApi.proposeAmendment(order.orderId, {
      newScope: scope.trim() || undefined,
      newPrice,
      newDurationDays,
      reason: reason.trim(),
    });
    onDone();
  }}>
    <label className={buttons.field}>
      <span className={buttons.label}>{t('scope')}</span>
      <textarea className={styles.input} rows={3} value={scope} onChange={e => setScope(e.target.value)} />
    </label>
    {canChangePrice && <label className={buttons.field}>
      <span className={buttons.label}>{t('newPrice')}</span>
      <input className={styles.input} type="number" min="1" step="1" value={price} onChange={e => setPrice(e.target.value)} />
    </label>}
    {canChangeDuration && <label className={buttons.field}>
      <span className={buttons.label}>{t('duration')}</span>
      <input className={styles.input} type="number" min="1" step="1" value={duration} onChange={e => setDuration(e.target.value)} />
    </label>}
    <label className={buttons.field}>
      <span className={buttons.label}>{t('reason')}</span>
      <textarea className={styles.input} rows={3} required value={reason} onChange={e => setReason(e.target.value)} />
    </label>
  </OrderFlowDialog>;
}

export default function OrderAgreementPanel({ order, role, onUpdated }) {
  const t = useTranslations('orderWorkspace');
  const locale = useLocale();
  const [agreement, setAgreement] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [proposing, setProposing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const { orderId, orderStatus } = order;
  useEffect(() => {
    let cancelled = false;
    Promise.all([orderApi.getAgreement(orderId), orderApi.getAmendments(orderId)]).then(([versions, amendments]) => {
      if (!cancelled) setAgreement({ versions: versions?.result ?? [], amendments: amendments?.result ?? [] });
    }).catch(() => {
      if (!cancelled) setLoadFailed(true);
    });
    return () => { cancelled = true; };
  }, [orderId, retry]);

  const current = agreement?.versions.at(-1);
  const amendable = !['COMPLETED', 'CANCELLED'].includes(orderStatus);
  const existingAmendment = agreement?.amendments.some(a => ['PENDING', 'AWAITING_PAYMENT'].includes(a.status));
  const price = amount => new Intl.NumberFormat(locale, { style: 'currency', currency: current?.currency || 'VND' }).format(amount);
  const date = iso => new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  const respond = async (amendment, action) => {
    setActionBusy(true);
    setActionError('');
    try {
      await orderApi.respondAmendment(orderId, amendment.amendmentId, action);
      onUpdated();
    } catch (err) {
      setActionError(err?.code === 3041 ? t('insufficientFunds') : orderErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  return <section className={styles.panel} aria-label={t('agreement')}>
    <strong className={styles.panelTitle}><ScrollText size={16} aria-hidden="true" />{t('agreement')}</strong>
    {loadFailed ? <p className={styles.warn} role="alert">{t('loadError')}{' '}
        <button type="button" className={buttons.linkBtn} onClick={() => { setLoadFailed(false); setRetry(x => x + 1); }}>{t('retry')}</button>
      </p> : !agreement && <p role="status" className={styles.note}>{t('loading')}</p>}
    {agreement && [...agreement.versions].reverse().map(version => <article key={version.agreementVersionId} className={styles.version}>
      <div className={styles.versionHead}>
        <strong>{t('version', { p0: version.versionNo })}</strong>
        {version.versionNo === current.versionNo && <span className={styles.chip}>{t('currentVersion')}</span>}
      </div>
      {version.scope && <p className={styles.quote}>{version.scope}</p>}
      {version.acceptanceCriteria && <p className={styles.quote}>{t('criteria', { p0: version.acceptanceCriteria })}</p>}
      {version.price != null && <p className={styles.note}>{t('price', { p0: price(version.price) })}</p>}
      {version.durationDays != null && <p className={styles.note}>{t('days', { p0: version.durationDays })}</p>}
      {version.scheduleStart && version.scheduleEnd && <p className={styles.note}>{t('schedule', { p0: date(version.scheduleStart), p1: date(version.scheduleEnd) })}</p>}
      {version.clientConfirmedAt && <p className={styles.note}>{t('clientConfirmed', { p0: date(version.clientConfirmedAt) })}</p>}
      {version.providerConfirmedAt && <p className={styles.note}>{t('providerConfirmed', { p0: date(version.providerConfirmedAt) })}</p>}
    </article>)}

    {current && <strong className={styles.panelTitle}>{t('amendments')}</strong>}
    {amendable && current && !existingAmendment && <button type="button" className={buttons.secondaryBtn} onClick={() => setProposing(true)}>{t('propose')}</button>}
    {actionError && <p className={styles.warn} role="alert">{actionError}</p>}
    {agreement?.amendments.map(amendment => {
      const pending = amendable && amendment.status === 'PENDING' && amendment.proposedByRole !== role;
      const awaiting = amendable && amendment.status === 'AWAITING_PAYMENT' && current?.versionNo === amendment.baseVersionNo;
      const delta = awaiting ? Number(amendment.newPrice) - Number(current.price) : 0;
      const canSettle = awaiting && (delta <= 0 || role === 'CLIENT');
      const paymentLabel = delta > 0 ? 'chargeDifference' : 'refundDifference';
      return <article className={styles.version} key={amendment.amendmentId}>
        <div className={styles.versionHead}>
          <strong>{t(amendment.proposedByRole === 'CLIENT' ? 'clientProposal' : 'providerProposal')}</strong>
          <span className={styles.chip}>{t.has(amendment.status) ? t(amendment.status) : amendment.status}</span>
        </div>
        <p className={styles.quote}>{amendment.reason}</p>
        {amendment.newScope && <p className={styles.text}>{amendment.newScope}</p>}
        {amendment.newPrice != null && <p className={styles.note}>{t('price', { p0: price(amendment.newPrice) })}</p>}
        {amendment.newDurationDays != null && <p className={styles.note}>{t('days', { p0: amendment.newDurationDays })}</p>}
        {pending && <div className={styles.versionHead}>
          <button type="button" className={buttons.primaryBtn} disabled={actionBusy} onClick={() => respond(amendment, 'accept')}>{t('accept')}</button>
          <button type="button" className={buttons.secondaryBtn} disabled={actionBusy} onClick={() => respond(amendment, 'reject')}>{t('reject')}</button>
        </div>}
        {canSettle && <button type="button" className={buttons.primaryBtn} disabled={actionBusy} onClick={() => {
          if (window.confirm(t(paymentLabel, { p0: price(Math.abs(delta)) }))) respond(amendment, 'settle');
        }}>{t(paymentLabel, { p0: price(Math.abs(delta)) })}</button>}
        {awaiting && !canSettle && <p className={styles.note}>{t('awaitingClient')}</p>}
      </article>;
    })}
    {proposing && <AmendmentDialog order={order} onClose={() => setProposing(false)} onDone={onUpdated} />}
  </section>;
}
