import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Paperclip, Trash2 } from 'lucide-react';
import { orderApi } from '../../../api/orderApi';
import OrderFlowDialog from './OrderFlowDialog';
import evidenceStyles from './WorkEvidence.module.css';
import styles from './OrderFlow.module.css';
import { orderLabel } from '../../../utils/orderNumber';

const MAX_DELIVERY_FILE_BYTES = 50 * 1024 * 1024;
const DELIVERY_FILE_TYPES = 'image/jpeg,image/png,image/webp,application/pdf,application/zip,video/mp4,.zip';
const isHttpUrl = s => /^https?:\/\/\S+$/i.test(s.trim());
const formatSize = bytes => bytes == null ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

// The 6 digits the client reads to the provider on arrival.
export function CheckinCode({
  code
}) {
  const tr = useTranslations("misc");
  return <span className={styles.code} aria-label={tr("m765", {
    p0: code.split('').join(' ')
  })}>
      {code}
    </span>;
}

// Provider, ONSITE + CONFIRMED: enter the client's code → IN_PROGRESS.
export function CheckinDialog({
  order,
  onClose,
  onDone
}) {
  const tr = useTranslations("misc");
  const [code, setCode] = useState('');
  return <OrderFlowDialog title={`Check-in ${orderLabel(order)}`} submitLabel="Check-in" canSubmit={/^\d{6}$/.test(code)} onSubmit={async () => {
    await orderApi.checkin(order.orderId, code);
    onDone(tr("m1515"));
  }} onClose={onClose}>
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>{tr("m782")}</span>
        <input className={`${styles.input} ${styles.codeInput}`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" />
      </label>
      <p className={styles.note}>{tr("m783")}</p>
    </OrderFlowDialog>;
}

// Client, DIGITAL + CONFIRMED: brief + reference links → IN_PROGRESS, deadline starts.
export function RequirementsDialog({
  order,
  onClose,
  onDone
}) {
  const tr = useTranslations("misc");
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState('');
  const references = links.split('\n').map(l => l.trim()).filter(Boolean);
  const badLink = references.find(l => !isHttpUrl(l));
  return <OrderFlowDialog title={tr("m1516")} submitLabel={tr("m635")} canSubmit={description.trim().length > 0 && !badLink} onSubmit={async () => {
    await orderApi.submitRequirements(order.orderId, {
      description: description.trim(),
      references
    });
    onDone(tr("m1517"));
  }} onClose={onClose}>
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>{tr("m784")}</span>
        <textarea className={styles.input} rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={tr("m1518")} />
      </label>
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>{tr("m785")}</span>
        <textarea className={styles.input} rows={3} value={links} onChange={e => setLinks(e.target.value)} placeholder="https://..." />
      </label>
      {badLink && <p className={styles.warn}>{tr("m1519")}{badLink}</p>}
      <p className={styles.note}>{tr("m787")}</p>
    </OrderFlowDialog>;
}

// In-scope repairs are unlimited; new scope uses an agreement addendum.
export function RevisionDialog({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [context, setContext] = useState(null);
  const [criterion, setCriterion] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    Promise.all([orderApi.getDeliveries(order.orderId), orderApi.getAgreement(order.orderId)])
      .then(([deliveries, versions]) => { if (!cancelled) setContext({ delivery: deliveries.result[0], agreement: versions.result.at(-1) }); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [order.orderId]);
  return <OrderFlowDialog title="Yêu cầu sửa lỗi trong phạm vi" submitLabel="Gửi yêu cầu sửa"
    canSubmit={!!context?.delivery && !!context?.agreement && !!criterion && !!reason.trim()}
    onSubmit={async () => {
      await orderApi.requestRevision(order.orderId, { reason: reason.trim(), deliveryVersion: context.delivery.versionNo,
        agreementVersion: context.agreement.versionNo, criterionRefs: [criterion], scopeChange: false });
      onDone('Đã gửi yêu cầu sửa');
    }} onClose={onClose}>
    {error && <p role="alert">{error}</p>}
    <p>Sửa lỗi trong phạm vi không giới hạn lượt. Thay đổi phạm vi cần tạo phụ lục cam kết.</p>
    {context && <p>Bản bàn giao {context.delivery?.versionNo} · Cam kết {context.agreement?.versionNo}</p>}
    <label>Tiêu chí chưa đạt<select className={styles.input} value={criterion} onChange={e => setCriterion(e.target.value)}>
      <option value="">Chọn tiêu chí cam kết</option>
      {context?.agreement?.scope && <option value="scope">Phạm vi: {context.agreement.scope}</option>}
      {context?.agreement?.acceptanceCriteria && <option value="acceptanceCriteria">Nghiệm thu: {context.agreement.acceptanceCriteria}</option>}
    </select></label>
    <label className={evidenceStyles.field}>Mô tả cụ thể lỗi so với tiêu chí
      <textarea className={styles.input} rows={5} maxLength={10000} value={reason} onChange={e => setReason(e.target.value)} />
    </label>
    <p>Provider phản hồi trong 24 giờ; hai bên chốt hạn sửa trong 48 giờ.</p>
  </OrderFlowDialog>;
}

// Provider, DIGITAL + IN_PROGRESS: message + files → DELIVERED.
export function DeliveryDialog({
  order,
  onClose,
  onDone
}) {
  const tr = useTranslations("misc");
  const t = useTranslations('orderWorkspace');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef(null);
  const nextFileKey = useRef(0);
  const uploadedIds = useRef(new WeakMap());
  const addFiles = e => {
    const picked = [...(e.target.files || [])];
    e.target.value = '';
    const invalid = picked.filter(file => !file.size || file.size > MAX_DELIVERY_FILE_BYTES);
    setFileError(invalid.length ? t('deliveryFileSize', { p0: invalid.map(file => file.name).join(', ') }) : '');
    const valid = picked.filter(file => file.size && file.size <= MAX_DELIVERY_FILE_BYTES)
      .map(file => ({ file, key: ++nextFileKey.current }));
    setFiles(prev => [...prev, ...valid]);
  };
  return <OrderFlowDialog title={tr("m1454", {
    p0: orderLabel(order)
  })} submitLabel={tr("m819")} canSubmit={files.length > 0} onSubmit={async () => {
    const attachments = [];
    for (const { file } of files) {
      let fileId = uploadedIds.current.get(file);
      if (!fileId) {
        const response = await orderApi.uploadFile(order.orderId, 'DELIVERY', file);
        fileId = response?.result?.storedFileId;
        if (!fileId) throw new Error(t('uploadError'));
        uploadedIds.current.set(file, fileId);
      }
      attachments.push({ fileId });
    }
    await orderApi.submitDelivery(order.orderId, {
      message: message.trim() || null,
      files: attachments
    });
    onDone(tr("m1525"));
  }} onClose={onClose}>
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>{tr("m790")}</span>
        <textarea className={styles.input} rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder={tr("m1526")} />
      </label>

      <div className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>{tr("m791")}</span>
        {files.length > 0 && <ul className={styles.fileList}>
            {files.map(({ file, key }) => <li key={key} className={styles.fileRow}>
                <Paperclip size={14} aria-hidden="true" />
                <span className={styles.fileName}>{file.name}</span>
                <small>{formatSize(file.size)}</small>
                <button type="button" className={evidenceStyles.iconBtn} onClick={() => setFiles(prev => prev.filter(x => x.key !== key))} aria-label={tr("m1455", {
            p0: file.name
          })}>
                  <Trash2 size={14} />
                </button>
              </li>)}
          </ul>}
        <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
          <FileUp size={16} />{tr("m793")}</button>
        <input ref={fileRef} type="file" accept={DELIVERY_FILE_TYPES} multiple hidden onChange={addFiles} />
        <p className={styles.note}>{t('deliveryFileHelp')}</p>
        {fileError && <p className={styles.warn} role="alert">{fileError}</p>}
      </div>
    </OrderFlowDialog>;
}
