import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Upload } from 'lucide-react';
import OrderStatusBadge from '../OrderDashboard/components/OrderStatusBadge';
import styles from './OrderCancelPage.module.css';

const NOTE_MIN = 20;
const NOTE_MAX = 500;

const REASONS = {
  CLIENT: [
    { code: 'CHANGED_MIND', label: 'Đổi ý / không còn nhu cầu' },
    { code: 'LATE', label: 'Chuyên gia chậm tiến độ' },
    { code: 'QUALITY', label: 'Chất lượng không như mô tả' },
    { code: 'NO_CONTACT', label: 'Không liên lạc được chuyên gia' },
    { code: 'WRONG_ORDER', label: 'Đặt nhầm gói / dịch vụ' },
    { code: 'OTHER', label: 'Lý do khác' },
  ],
  PROVIDER: [
    { code: 'OVERLOADED', label: 'Quá tải lịch, không kịp nhận đơn' },
    { code: 'OUT_OF_SCOPE', label: 'Yêu cầu ngoài phạm vi gói' },
    { code: 'MISSING_INFO', label: 'Thiếu thông tin từ khách hàng' },
    { code: 'OTHER', label: 'Lý do khác' },
  ],
};

const formatPrice = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' ₫';

// What cancelling means for this order/role. null → cancelling is not allowed
// (order-service ErrorCode.ORDER_CANCEL_NOT_ALLOWED).
export function getCancelPolicy(order, role) {
  if (!order) return null;
  const status = order.orderStatus;
  if (role === 'PROVIDER') {
    return status === 'CONFIRMED'
      ? { mode: 'immediate', paid: order.totalAmount, deducted: 0, refund: order.totalAmount }
      : null;
  }
  if (status === 'PENDING_PAYMENT') return { mode: 'immediate', paid: 0, deducted: 0, refund: 0 };
  if (status === 'CONFIRMED') {
    return { mode: 'immediate', paid: order.totalAmount, deducted: 0, refund: order.totalAmount };
  }
  if (status === 'IN_PROGRESS' || status === 'DELIVERED') {
    if (order.cancelRequest) return null;
    return { mode: 'request', paid: order.totalAmount, deducted: order.platformFee, refund: order.subtotal };
  }
  return null;
}

export default function OrderCancelPage({ order, role = 'CLIENT', onBack, onSubmit }) {
  const policy = useMemo(() => getCancelPolicy(order, role), [order, role]);
  const reasons = REASONS[role] || REASONS.CLIENT;

  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isProvider = role === 'PROVIDER';
  const isRequest = policy?.mode === 'request';
  const noteRequired = isRequest || reasonCode === 'OTHER';
  const noteOk = !noteRequired || note.trim().length >= NOTE_MIN;
  const showNoteError = noteTouched && !noteOk;
  const canSubmit = Boolean(reasonCode) && noteOk && confirmed;

  const title = isProvider ? 'Từ chối đơn hàng' : isRequest ? 'Yêu cầu hủy đơn hàng' : 'Hủy đơn hàng';
  const submitLabel = isProvider ? 'Từ chối đơn' : isRequest ? 'Gửi yêu cầu hủy' : 'Xác nhận hủy đơn';
  const partnerLabel = isProvider ? 'Khách hàng' : 'Chuyên gia';

  const subtitle = isProvider
    ? 'Khách hàng sẽ được hoàn 100% số tiền đã thanh toán. Từ chối thường xuyên có thể ảnh hưởng tới xếp hạng của bạn.'
    : isRequest
      ? 'Đơn đang được thực hiện nên yêu cầu sẽ được gửi tới chuyên gia và WorkGo xem xét trong vòng 48 giờ.'
      : 'Chuyên gia chưa bắt đầu thực hiện, đơn sẽ được hủy ngay khi bạn xác nhận.';

  const handleSubmit = (e) => {
    e.preventDefault();
    setNoteTouched(true);
    if (!canSubmit || !policy) return;
    const reason = reasons.find((r) => r.code === reasonCode);
    onSubmit({ reasonCode, reasonLabel: reason?.label || reasonCode, note: note.trim(), mode: policy.mode });
  };

  const breadcrumb = (
    <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Đơn hàng
      </button>
      <span className={styles.sep}>/</span>
      <span>{order?.orderNumber}</span>
      <span className={styles.sep}>/</span>
      <span className={styles.current}>{isProvider ? 'Từ chối' : 'Yêu cầu hủy'}</span>
    </nav>
  );

  if (!policy) {
    return (
      <div>
        {breadcrumb}
        <section className={styles.blocked} role="alert">
          <AlertTriangle size={40} className={styles.blockedIcon} />
          <h1 className={styles.pageTitle}>Không thể hủy đơn này</h1>
          <p>
            {order?.cancelRequest
              ? 'Đơn đã có yêu cầu hủy đang chờ xử lý.'
              : 'Đơn đã hoàn tất, đã hủy hoặc bạn không có quyền hủy ở trạng thái hiện tại.'}
          </p>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onBack}>
            Quay lại danh sách
          </button>
        </section>
      </div>
    );
  }

  const steps = isRequest
    ? [
        { title: 'Gửi yêu cầu', desc: 'Đơn được gắn trạng thái "Đang yêu cầu hủy"' },
        { title: 'Chuyên gia phản hồi', desc: 'Trong vòng 48 giờ, quá hạn WorkGo sẽ xử lý' },
        { title: 'Hoàn tiền từ Escrow', desc: 'Về nguồn thanh toán sau 3–5 ngày làm việc' },
      ]
    : [
        { title: 'Hủy đơn ngay', desc: 'Đơn chuyển sang "Đã hủy"' },
        ...(policy.paid > 0
          ? [{ title: 'Hoàn tiền từ Escrow', desc: 'Về nguồn thanh toán sau 3–5 ngày làm việc' }]
          : []),
      ];

  return (
    <div>
      {breadcrumb}
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.pageSubtitle}>{subtitle}</p>

      <div className={styles.cancelGrid}>
        {/* ===== Form ===== */}
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <fieldset className={styles.field}>
            <legend className={styles.fieldLabel}>
              Lý do {isProvider ? 'từ chối' : 'hủy'} <span className={styles.req}>*</span>
            </legend>
            <div className={styles.reasonList}>
              {reasons.map((r) => (
                <label
                  key={r.code}
                  className={`${styles.reasonCard} ${reasonCode === r.code ? styles.reasonSelected : ''}`}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={r.code}
                    checked={reasonCode === r.code}
                    onChange={() => setReasonCode(r.code)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="cancel-note">
              Mô tả chi tiết {noteRequired ? <span className={styles.req}>*</span> : <span className={styles.optional}>(tùy chọn)</span>}
            </label>
            <textarea
              id="cancel-note"
              rows={5}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => setNoteTouched(true)}
              className={`${styles.textarea} ${showNoteError ? styles.textareaInvalid : ''}`}
              placeholder={
                isProvider
                  ? 'Giải thích ngắn gọn cho khách hàng lý do bạn không thể nhận đơn...'
                  : `Nêu rõ vấn đề bạn gặp, các mốc đã trao đổi với chuyên gia... (tối thiểu ${NOTE_MIN} ký tự)`
              }
              aria-invalid={showNoteError}
              aria-describedby="cancel-note-hint cancel-note-error"
            />
            <div className={styles.fieldFoot}>
              {showNoteError && (
                <span id="cancel-note-error" className={styles.error}>
                  Vui lòng mô tả ít nhất {NOTE_MIN} ký tự.
                </span>
              )}
              <span id="cancel-note-hint" className={styles.counter}>
                {note.length}/{NOTE_MAX}
              </span>
            </div>
          </div>

          {isRequest && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Bằng chứng (tùy chọn)</span>
              <label className={styles.upload}>
                <input type="file" multiple accept="image/*,.pdf" className={styles.uploadInput} />
                <Upload size={22} />
                <span>
                  Kéo thả hoặc <strong>chọn tệp</strong> — ảnh chụp tin nhắn, file bàn giao (PNG, JPG, PDF ≤ 5MB)
                </span>
              </label>
            </div>
          )}

          <label className={styles.confirm}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>
              {isRequest
                ? 'Tôi hiểu rằng khi yêu cầu được chấp nhận, đơn sẽ bị hủy và không thể khôi phục.'
                : 'Tôi hiểu rằng đơn sẽ bị hủy ngay và không thể khôi phục.'}
            </span>
          </label>

          <div className={styles.formActions}>
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onBack}>
              Quay lại
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnDanger}`} disabled={!canSubmit}>
              {submitLabel}
            </button>
          </div>
        </form>

        {/* ===== Summary ===== */}
        <aside className={styles.summary} aria-label="Tóm tắt đơn hàng">
          <h2 className={styles.cardTitle}>Đơn hàng</h2>
          <div className={styles.orderHead}>
            <span className={styles.orderNo}>{order.orderNumber}</span>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className={styles.svcTitle}>{order.title}</p>
          {order.counterpartName && (
            <p className={styles.partner}>
              {partnerLabel}: <strong>{order.counterpartName}</strong>
            </p>
          )}

          <div className={styles.refund}>
            <h3>{isProvider ? 'Khách được hoàn' : 'Hoàn tiền dự kiến'}</h3>
            {policy.paid === 0 ? (
              <p className={styles.refundNote}>Đơn chưa thanh toán nên không phát sinh hoàn tiền.</p>
            ) : (
              <>
                <dl>
                  <div>
                    <dt>Đã thanh toán</dt>
                    <dd>{formatPrice(policy.paid)}</dd>
                  </div>
                  {policy.deducted > 0 && (
                    <div>
                      <dt>Phí nền tảng (không hoàn)</dt>
                      <dd>−{formatPrice(policy.deducted)}</dd>
                    </div>
                  )}
                  <div className={styles.refundTotal}>
                    <dt>{isRequest ? 'Hoàn tối đa' : 'Hoàn 100%'}</dt>
                    <dd>{formatPrice(policy.refund)}</dd>
                  </div>
                </dl>
                {isRequest && (
                  <p className={styles.refundNote}>
                    Mức hoàn cuối cùng phụ thuộc phần việc chuyên gia đã thực hiện và kết quả đối soát.
                  </p>
                )}
              </>
            )}
          </div>

          <ol className={styles.timeline}>
            {steps.map((s, i) => (
              <li key={s.title} className={i === 0 ? styles.tlActive : ''}>
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
