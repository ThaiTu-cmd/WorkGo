import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { orderApi, orderErrorMessage } from '../../../api/orderApi';
import styles from './OrderFlow.module.css';
import buttons from './WorkEvidence.module.css';

export default function OrderInputPanel({ order, role, onUpdated }) {
  const t = useTranslations('orderInputs');
  const [state, setState] = useState(null);
  const [revision, setRevision] = useState(0);
  const [requirements, setRequirements] = useState('');
  const [none, setNone] = useState(false);
  const [values, setValues] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    Promise.all([orderApi.getAgreement(order.orderId), orderApi.getInputs(order.orderId).catch(e => {
      if (e?.code === 3051) return { result: null };
      throw e;
    })]).then(([versions, inputs]) => {
      if (!cancelled) setState({ agreement: versions.result.at(-1), inputs: inputs.result });
    }).catch(e => { if (!cancelled) setError(orderErrorMessage(e)); });
    return () => { cancelled = true; };
  }, [order.orderId, order.orderStatus, revision]);
  const row = state?.inputs;
  const editable = ['PENDING_PAYMENT', 'CONFIRMED'].includes(order.orderStatus);
  const version = row && { checklistVersion: row.checklistVersion, expectedVersion: row.version };
  const run = async send => {
    if (busy) return;
    setBusy(true); setError('');
    try { await send(); setRevision(x => x+1); onUpdated(); }
    catch (e) { setError(orderErrorMessage(e)); setRevision(x => x+1); }
    finally { setBusy(false); }
  };
  return <section className={styles.panel} aria-label={t('title')}>
    <strong className={styles.panelTitle}>{t('title')}</strong>
    {error && <p role="alert" className={styles.warn}>{error}</p>}
    <button className={buttons.linkBtn} onClick={() => { setError(''); setRevision(x => x+1); }} disabled={busy}>{t('retry')}</button>
    {state && !row && <p>{t('pending')}</p>}
    {row && <>
      <pre className={styles.quote}>{row.requirements === '[]' ? t('none') : JSON.parse(row.requirements).join('\n')}</pre>
      {row.submittedValues && <><strong>{t('stored')}</strong><pre className={styles.quote}>{JSON.stringify(JSON.parse(row.submittedValues), null, 2)}</pre></>}
      {row.missingReason && <p role="status" className={styles.warn}>{row.missingReason}</p>}
      {row.acceptedAt ? <p>{t('accepted')}</p> : row.responseDueAt ? <p>{t('waiting')} {new Date(row.responseDueAt).toLocaleString()}</p> : null}
    </>}
    {editable && state && !row?.clientConfirmedAt && role === 'PROVIDER' && <>
      <label>{t('proposal')}<textarea className={styles.input} value={requirements} onChange={e => setRequirements(e.target.value)} disabled={busy || none} /></label>
      <label><input type="checkbox" checked={none} onChange={e => setNone(e.target.checked)} disabled={busy} />{t('none')}</label>
      <button className={buttons.primaryBtn} disabled={busy || (!none && !requirements.trim())} onClick={() => run(() => orderApi.proposeInputs(order.orderId, { agreementVersion: state.agreement.versionNo, requirements: none ? [] : requirements.split('\n').map(x => x.trim()).filter(Boolean) }))}>{t('propose')}</button>
    </>}
    {editable && row && !row.clientConfirmedAt && role === 'CLIENT' && <button className={buttons.primaryBtn} disabled={busy} onClick={() => run(() => orderApi.confirmInputs(order.orderId, version))}>{t('confirm')}</button>}
    {editable && row?.clientConfirmedAt && !row.acceptedAt && !row.responseDueAt && role === 'CLIENT' && <>
      <label>{t('values')}<textarea className={styles.input} value={values} onChange={e => setValues(e.target.value)} disabled={busy} /></label>
      <button className={buttons.primaryBtn} disabled={busy || !values.trim()} onClick={() => run(() => orderApi.submitInputs(order.orderId, { ...version, values: { description: values.trim() } }))}>{t('submit')}</button>
    </>}
    {editable && row?.responseDueAt && !row.acceptedAt && role === 'PROVIDER' && <>
      <button className={buttons.primaryBtn} disabled={busy} onClick={() => run(() => orderApi.reviewInputs(order.orderId, { ...version, sufficient: true }))}>{t('accept')}</button>
      <label>{t('missing')}<textarea className={styles.input} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /></label>
      <button className={buttons.secondaryBtn} disabled={busy || !reason.trim()} onClick={() => run(() => orderApi.reviewInputs(order.orderId, { ...version, sufficient: false, missingReason: reason.trim() }))}>{t('reject')}</button>
    </>}
  </section>;
}
