import React, { useRef, useState } from 'react';
import { FileUp, Link2, Paperclip, Plus, Trash2 } from 'lucide-react';
import { orderApi } from '../../../api/orderApi';
import OrderFlowDialog from './OrderFlowDialog';
import evidenceStyles from './WorkEvidence.module.css';
import styles from './OrderFlow.module.css';

// No file storage service yet: small files travel as data URLs (like evidence photos).
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test(s.trim());

const formatSize = (bytes) =>
  bytes == null ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không đọc được file ${file.name}.`));
    reader.readAsDataURL(file);
  });

// The 6 digits the client reads to the provider on arrival.
export function CheckinCode({ code }) {
  return (
    <span className={styles.code} aria-label={`Mã check-in ${code.split('').join(' ')}`}>
      {code}
    </span>
  );
}

// Shown right after an ONSITE order is paid: the only time order-service returns the code.
export function CheckinCodeDialog({ code, onClose }) {
  return (
    <OrderFlowDialog title="Thanh toán thành công" onClose={onClose} closeLabel="Đã lưu mã">
      <p className={styles.text}>Đọc mã này cho chuyên gia khi họ tới nơi để bắt đầu làm việc:</p>
      <CheckinCode code={code} />
      <p className={styles.note}>
        Mã được lưu trên trình duyệt này và hiện lại trong phần Chi tiết của đơn. WorkGo không gửi lại mã, hãy ghi lại
        nếu bạn dùng thiết bị khác.
      </p>
    </OrderFlowDialog>
  );
}

// Provider, ONSITE + CONFIRMED: enter the client's code → IN_PROGRESS.
export function CheckinDialog({ order, onClose, onDone }) {
  const [code, setCode] = useState('');
  return (
    <OrderFlowDialog
      title={`Check-in ${order.orderNumber}`}
      submitLabel="Check-in"
      canSubmit={/^\d{6}$/.test(code)}
      onSubmit={async () => {
        await orderApi.checkin(order.orderId, code);
        onDone('Đã check-in, đơn chuyển sang Đang thực hiện');
      }}
      onClose={onClose}
    >
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>Mã check-in của khách (6 số)</span>
        <input
          className={`${styles.input} ${styles.codeInput}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
        />
      </label>
      <p className={styles.note}>Chỉ check-in được khi đã tới nơi, sớm nhất 30 phút trước giờ hẹn.</p>
    </OrderFlowDialog>
  );
}

// Client, DIGITAL + CONFIRMED: brief + reference links → IN_PROGRESS, deadline starts.
export function RequirementsDialog({ order, onClose, onDone }) {
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState('');
  const references = links
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const badLink = references.find((l) => !isHttpUrl(l));
  return (
    <OrderFlowDialog
      title="Gửi yêu cầu cho chuyên gia"
      submitLabel="Gửi yêu cầu"
      canSubmit={description.trim().length > 0 && !badLink}
      onSubmit={async () => {
        await orderApi.submitRequirements(order.orderId, { description: description.trim(), references });
        onDone('Đã gửi yêu cầu, chuyên gia bắt đầu thực hiện');
      }}
      onClose={onClose}
    >
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>Mô tả công việc</span>
        <textarea
          className={styles.input}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bạn cần gì, phong cách mong muốn, nội dung cần có..."
        />
      </label>
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>Link tham khảo (không bắt buộc, mỗi dòng một link)</span>
        <textarea
          className={styles.input}
          rows={3}
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="https://..."
        />
      </label>
      {badLink && <p className={styles.warn}>Link không hợp lệ: {badLink}</p>}
      <p className={styles.note}>Hạn bàn giao được tính từ lúc gửi yêu cầu. Yêu cầu chỉ gửi được một lần.</p>
    </OrderFlowDialog>
  );
}

// Client, DIGITAL + DELIVERED: reason → back to IN_PROGRESS (uses one revision).
export function RevisionDialog({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');
  return (
    <OrderFlowDialog
      title="Yêu cầu chỉnh sửa"
      submitLabel="Gửi yêu cầu sửa"
      canSubmit={reason.trim().length > 0}
      onSubmit={async () => {
        await orderApi.requestRevision(order.orderId, reason.trim());
        onDone('Đã gửi yêu cầu chỉnh sửa');
      }}
      onClose={onClose}
    >
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>Cần sửa những gì?</span>
        <textarea
          className={styles.input}
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nêu rõ phần chưa đạt và mong muốn của bạn..."
        />
      </label>
      <p className={styles.note}>Mỗi lần yêu cầu sửa dùng một lượt chỉnh sửa của gói.</p>
    </OrderFlowDialog>
  );
}

// Provider, DIGITAL + IN_PROGRESS: message + files (links or small uploads) → DELIVERED.
export function DeliveryDialog({ order, onClose, onDone }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]); // DeliveryFileRequest + local key
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const fileRef = useRef(null);

  const addLink = () => {
    if (!isHttpUrl(linkUrl)) return setFileError('Link phải bắt đầu bằng http:// hoặc https://');
    setFileError('');
    const url = linkUrl.trim();
    setFiles((prev) => [...prev, { key: `${Date.now()}-${url}`, fileUrl: url, fileName: linkName.trim() || url }]);
    setLinkName('');
    setLinkUrl('');
  };

  const addFiles = async (e) => {
    const picked = [...(e.target.files || [])];
    e.target.value = '';
    const tooBig = picked.filter((f) => f.size > MAX_FILE_BYTES);
    setFileError(tooBig.length ? `Quá 2 MB, hãy gửi bằng link: ${tooBig.map((f) => f.name).join(', ')}` : '');
    try {
      const read = await Promise.all(
        picked
          .filter((f) => f.size <= MAX_FILE_BYTES)
          .map(async (f) => ({
            key: `${Date.now()}-${f.name}`,
            fileUrl: await readAsDataUrl(f),
            fileName: f.name,
            mimeType: f.type || null,
            sizeBytes: f.size,
          }))
      );
      setFiles((prev) => [...prev, ...read]);
    } catch (err) {
      setFileError(err.message);
    }
  };

  return (
    <OrderFlowDialog
      title={`Nộp bài ${order.orderNumber}`}
      submitLabel="Nộp bài"
      canSubmit={files.length > 0}
      onSubmit={async () => {
        await orderApi.submitDelivery(order.orderId, {
          message: message.trim() || null,
          files: files.map(({ key, ...file }) => file),
        });
        onDone('Đã nộp bài, chờ khách nghiệm thu');
      }}
      onClose={onClose}
    >
      <label className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>Lời nhắn cho khách (không bắt buộc)</span>
        <textarea
          className={styles.input}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tóm tắt những gì bạn bàn giao, cách sử dụng..."
        />
      </label>

      <div className={evidenceStyles.field}>
        <span className={evidenceStyles.label}>File bàn giao</span>
        {files.length > 0 && (
          <ul className={styles.fileList}>
            {files.map((f) => (
              <li key={f.key} className={styles.fileRow}>
                {f.fileUrl.startsWith('data:') ? <Paperclip size={14} /> : <Link2 size={14} />}
                <span className={styles.fileName}>{f.fileName}</span>
                {f.sizeBytes != null && <small>{formatSize(f.sizeBytes)}</small>}
                <button
                  type="button"
                  className={evidenceStyles.iconBtn}
                  onClick={() => setFiles((prev) => prev.filter((x) => x.key !== f.key))}
                  aria-label={`Bỏ ${f.fileName}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.linkRow}>
          <input
            className={styles.input}
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Tên (vd: Bản thiết kế Figma)"
            aria-label="Tên link"
          />
          <input
            className={styles.input}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="https://drive.google.com/..."
            aria-label="Đường dẫn"
          />
          <button type="button" className={evidenceStyles.secondaryBtn} onClick={addLink} disabled={!linkUrl.trim()}>
            <Plus size={14} /> Thêm link
          </button>
        </div>
        <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
          <FileUp size={16} /> Chọn file từ máy (tối đa 2 MB mỗi file)
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={addFiles} />
        {fileError && <p className={styles.warn}>{fileError}</p>}
      </div>
    </OrderFlowDialog>
  );
}
