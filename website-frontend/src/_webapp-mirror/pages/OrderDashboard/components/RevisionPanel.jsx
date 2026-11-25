import { useEffect, useState } from 'react';
import { orderApi, orderErrorMessage } from '../../../api/orderApi';
import styles from './OrderFlow.module.css';

export default function RevisionPanel({ order, role, onUpdated }) {
  const [rows, setRows] = useState([]);
  const [reload, setReload] = useState(0);
  const [response, setResponse] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    orderApi.getRevisions(order.orderId).then(res => { if (!cancelled) setRows(res.result); })
      .catch(e => { if (!cancelled) setError(orderErrorMessage(e)); });
    return () => { cancelled = true; };
  }, [order.orderId, order.orderStatus, reload]);
  const run = async send => {
    if (busy) return;
    setBusy(true); setError('');
    try { await send(); setResponse(''); setDeadline(''); onUpdated(); }
    catch (e) { setError(orderErrorMessage(e)); }
    finally { setBusy(false); setReload(x => x + 1); }
  };
  const parsedDeadline = new Date(deadline);
  const validDeadline = Number.isFinite(parsedDeadline.getTime());
  return <section className={styles.panel} aria-label="Sửa lỗi trong phạm vi">
    <strong>Sửa lỗi trong phạm vi không giới hạn lượt</strong>
    <p>Thay đổi ngoài cam kết cần phụ lục. Quá 24 giờ chưa phản hồi hoặc 48 giờ chưa chốt hạn: liên hệ ADMIN hỗ trợ.</p>
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} onClick={() => { setError(''); setReload(x => x + 1); }}>Tải lại</button>
    {rows.map(row => <article key={row.revisionRequestId}>
      <p>Bản bàn giao {row.deliveryVersion ?? 'cũ'} · Cam kết {row.agreementVersion ?? 'cũ'} · {row.status}</p>
      <p>{row.criterionRefs?.join(', ')}: {row.reason}</p>
      {row.scopeSnapshot && <p>Phạm vi: {row.scopeSnapshot}</p>}
      {row.criteriaSnapshot && <p>Tiêu chí: {row.criteriaSnapshot}</p>}
      <p>Phản hồi trước: {row.responseDueAt ? new Date(row.responseDueAt).toLocaleString() : '—'} · Chốt hạn trước: {row.deadlineAgreementDueAt ? new Date(row.deadlineAgreementDueAt).toLocaleString() : '—'}</p>
      {row.adminSuggested && <p>Đã 3 vòng hoặc 7 ngày sửa: nên yêu cầu ADMIN hỗ trợ; vẫn có thể tiếp tục sửa.</p>}
      {row.supportRequired && <p role="status">Quá hạn phản hồi/chốt hạn. Cần ADMIN hỗ trợ, không tự kết luận lỗi.</p>}
      {row.providerResponse && <p>Provider: {row.providerResponse}</p>}
      {row.proposedRepairDeadline && <p>Hạn đề xuất: {new Date(row.proposedRepairDeadline).toLocaleString()}</p>}
      {row.agreedRepairDeadline && <p>Hạn đã chốt: {new Date(row.agreedRepairDeadline).toLocaleString()}</p>}
      {order.orderStatus === 'IN_PROGRESS' && ['OPEN', 'RESPONDED'].includes(row.status) && role === 'PROVIDER' && <>
        <label>Phản hồi<textarea className={styles.input} value={response} maxLength={10000} onChange={e => setResponse(e.target.value)} /></label>
        <label>Hạn sửa đề xuất<input className={styles.input} type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></label>
        <button disabled={busy || !response.trim() || !validDeadline} onClick={() => run(() => orderApi.respondRevision(order.orderId, row.revisionRequestId,
          { response: response.trim(), proposedRepairDeadline: parsedDeadline.toISOString() }))}>Gửi phản hồi và hạn sửa</button>
      </>}
      {order.orderStatus === 'IN_PROGRESS' && row.status === 'RESPONDED' && role === 'CLIENT' && <button disabled={busy}
        onClick={() => run(() => orderApi.confirmRepairDeadline(order.orderId, row.revisionRequestId, row.proposedRepairDeadline))}>Đồng ý hạn sửa đề xuất</button>}
    </article>)}
  </section>;
}
