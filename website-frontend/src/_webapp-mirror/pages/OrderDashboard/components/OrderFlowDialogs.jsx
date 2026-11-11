import { useTranslations } from "next-intl";
import React, { useRef, useState } from 'react';
import { FileUp, Link2, Paperclip, Plus, Trash2 } from 'lucide-react';
import { orderApi } from '../../../api/orderApi';
import OrderFlowDialog from './OrderFlowDialog';
import evidenceStyles from './WorkEvidence.module.css';
import styles from './OrderFlow.module.css';
import { orderLabel } from '../../../utils/orderNumber';

// No file storage service yet: small files travel as data URLs (like evidence photos).
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const isHttpUrl = s => /^https?:\/\/\S+$/i.test(s.trim());
const formatSize = bytes => bytes == null ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
// `tr` comes from the calling component (useTranslations only exists inside components).
const readAsDataUrl = (file, tr) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(tr("m764", {
    p0: file.name
  })));
  reader.readAsDataURL(file);
});

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

// Client, DIGITAL + DELIVERED: reason → back to IN_PROGRESS (uses one revision).
export function RevisionDialog({
  order,
  onClose,
  onDone
}) {
  const tr = useTranslations("misc");
  const [reason, setReason] = useState('');
  return <OrderFlowDialog title={tr("m1520")} submitLabel={tr("m1521")} canSubmit={reason.trim().length > 0} onSubmit={async () => {
    await orderApi.requestRevision(order.orderId, reason.trim());
    onDone(tr("m1522"));
  }} onClose={onClose}>
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>{tr("m788")}</span>
        <textarea className={styles.input} rows={5} value={reason} onChange={e => setReason(e.target.value)} placeholder={tr("m1523")} />
      </label>
      <p className={styles.note}>{tr("m789")}</p>
    </OrderFlowDialog>;
}

// Provider, DIGITAL + IN_PROGRESS: message + files (links or small uploads) → DELIVERED.
export function DeliveryDialog({
  order,
  onClose,
  onDone
}) {
  const tr = useTranslations("misc");
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]); // DeliveryFileRequest + local key
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const fileRef = useRef(null);
  const addLink = () => {
    if (!isHttpUrl(linkUrl)) return setFileError(tr("m1524"));
    setFileError('');
    const url = linkUrl.trim();
    setFiles(prev => [...prev, {
      key: `${Date.now()}-${url}`,
      fileUrl: url,
      fileName: linkName.trim() || url
    }]);
    setLinkName('');
    setLinkUrl('');
  };
  const addFiles = async e => {
    const picked = [...(e.target.files || [])];
    e.target.value = '';
    const tooBig = picked.filter(f => f.size > MAX_FILE_BYTES);
    setFileError(tooBig.length ? tr("m1453", {
      p0: tooBig.map(f => f.name).join(', ')
    }) : '');
    try {
      const read = await Promise.all(picked.filter(f => f.size <= MAX_FILE_BYTES).map(async f => ({
        key: `${Date.now()}-${f.name}`,
        fileUrl: await readAsDataUrl(f, tr),
        fileName: f.name,
        mimeType: f.type || null,
        sizeBytes: f.size
      })));
      setFiles(prev => [...prev, ...read]);
    } catch (err) {
      setFileError(err.message);
    }
  };
  return <OrderFlowDialog title={tr("m1454", {
    p0: orderLabel(order)
  })} submitLabel={tr("m819")} canSubmit={files.length > 0} onSubmit={async () => {
    await orderApi.submitDelivery(order.orderId, {
      message: message.trim() || null,
      files: files.map(({
        key,
        ...file
      }) => file)
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
            {files.map(f => <li key={f.key} className={styles.fileRow}>
                {f.fileUrl.startsWith('data:') ? <Paperclip size={14} /> : <Link2 size={14} />}
                <span className={styles.fileName}>{f.fileName}</span>
                {f.sizeBytes != null && <small>{formatSize(f.sizeBytes)}</small>}
                <button type="button" className={evidenceStyles.iconBtn} onClick={() => setFiles(prev => prev.filter(x => x.key !== f.key))} aria-label={tr("m1455", {
            p0: f.fileName
          })}>
                  <Trash2 size={14} />
                </button>
              </li>)}
          </ul>}
        <div className={styles.linkRow}>
          <input className={styles.input} value={linkName} onChange={e => setLinkName(e.target.value)} placeholder={tr("m1527")} aria-label={tr("m1528")} />
          <input className={styles.input} value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addLink();
          }
        }} placeholder="https://drive.google.com/..." aria-label={tr("m778")} />
          <button type="button" className={evidenceStyles.secondaryBtn} onClick={addLink} disabled={!linkUrl.trim()}>
            <Plus size={14} />{tr("m792")}</button>
        </div>
        <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
          <FileUp size={16} />{tr("m793")}</button>
        <input ref={fileRef} type="file" multiple hidden onChange={addFiles} />
        {fileError && <p className={styles.warn}>{fileError}</p>}
      </div>
    </OrderFlowDialog>;
}