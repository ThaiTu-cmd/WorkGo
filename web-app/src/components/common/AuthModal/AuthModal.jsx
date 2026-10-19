import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './AuthModal.module.css';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

// Cycle 4 — mock-only auth contract. Kept inline (instead of importing
// trung-pages/_stores/auth.ts) so this file stays byte-identical in
// web-app/src and website-frontend/src/_webapp-mirror.
const AUTH_TOKEN_KEY = 'accessToken';
const AUTH_USER_KEY = 'workgo_auth_user';
const AUTH_EVENT = 'workgo-auth-changed';
const DEMO_HINT_ID = 'auth-demo-hint';
// F-17 / debt D4: EC-TRUNG-15 copy, verbatim — shown when the session cannot be
// persisted (localStorage blocked or quota-full) instead of failing silently.
const QUOTA_TOAST =
  'Bộ nhớ trình duyệt bị đầy hoặc bị chặn — thay đổi chỉ được giữ trong phiên này.';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * @param onSuccess  ({ name, email }) => boolean | void  — host hook (the
 *   website shell persists through the shared auth store and reports whether the
 *   session was actually stored; `false` = storage blocked/full). Without the
 *   hook we persist inline so the standalone web-app keeps working.
 */
export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errors, setErrors] = useState({});
  const closeBtnRef = useRef(null);
  const trapRef = useRef(null);
  // F3: keep Tab cycling inside the dialog.
  useFocusTrap(trapRef, true);

  // R3: Escape closes the modal; focus lands on Close for keyboard users.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    if (closeBtnRef.current) closeBtnRef.current.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validateField = (field, values) => {
    const value = String(values[field] || '').trim();
    if (field === 'userName') return value ? undefined : 'Vui lòng nhập tên tài khoản.';
    if (field === 'password') {
      if (!value) return 'Vui lòng nhập mật khẩu.';
      return value.length < 6 ? 'Mật khẩu tối thiểu 6 ký tự.' : undefined;
    }
    if (field === 'lastName') return value ? undefined : 'Vui lòng nhập họ.';
    if (field === 'firstName') return value ? undefined : 'Vui lòng nhập tên.';
    if (field === 'email') return EMAIL_RE.test(value) ? undefined : 'Email chưa đúng định dạng.';
    return undefined;
  };

  const fieldsForMode = () =>
    mode === 'login' ? ['userName', 'password'] : ['lastName', 'firstName', 'userName', 'email', 'password'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // BUG-4 (cycle 4): an existing error clears as soon as the user fixes it.
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, formData) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    fieldsForMode().forEach((field) => {
      found[field] = validateField(field, formData);
    });
    setErrors(found);
    if (fieldsForMode().some((field) => found[field])) {
      setFeedback({ type: 'error', message: 'Vui lòng kiểm tra lại các trường được đánh dấu.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    await new Promise((resolve) => setTimeout(resolve, 350));

    const isDemoAdmin = formData.userName.trim().toLowerCase() === 'admin';
    const fullName = isDemoAdmin
      ? 'admin'
      : [formData.lastName, formData.firstName]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(' ');
    const user = {
      name: fullName || formData.userName.trim(),
      email: isDemoAdmin ? 'admin@workgo.vn' : (formData.email.trim() || `${formData.userName.trim()}@workgo.demo`)
    };

    // F-17 / debt D4: never fail silently — both persistence paths report
    // whether the session was actually stored, and the user is told when it was
    // not (the session then lives only for this tab).
    let persisted = true;
    if (onSuccess) {
      persisted = onSuccess(user) !== false;
    } else {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, `mock-token-${Date.now()}`);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } catch {
        // storage blocked — the session lives only for this tab
        persisted = false;
      }
      window.dispatchEvent(new Event(AUTH_EVENT));
    }

    if (!persisted) {
      setFeedback({ type: 'error', message: QUOTA_TOAST });
      setLoading(false);
      return;
    }

    setFeedback({
      type: 'success',
      message:
        mode === 'login'
          ? `Đăng nhập thành công! Chào mừng ${user.name} (Demo).`
          : `Đăng ký thành công (Demo)! Bạn đã được đăng nhập với tên ${user.name}.`
    });
    setLoading(false);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} ref={trapRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Đăng nhập vào WorkGo' : 'Tạo tài khoản WorkGo mới'}>
        {/* Close Button */}
        <button type="button" ref={closeBtnRef} className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.logoPill}>
            <span>W</span>
          </div>
          <h2 className={styles.modalTitle}>
            {mode === 'login' ? 'Đăng nhập vào WorkGo' : 'Tạo tài khoản WorkGo mới'}
          </h2>
          <p className={styles.modalSubtitle}>
            {mode === 'login' 
              ? 'Khám phá và kết nối với các dịch vụ chuyên nghiệp hàng đầu' 
              : 'Tham gia sàn giao dịch dịch vụ uy tín với bảo chứng an toàn'}
          </p>
        </div>

        {/* Tab switch */}
        <div className={styles.tabToggle}>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setMode('login'); setFeedback(null); setErrors({}); }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => { setMode('register'); setFeedback(null); setErrors({}); }}
          >
            Đăng ký
          </button>
        </div>

        {/* Notification feedback */}
        {feedback && (
          <div className={`${styles.feedbackBox} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Demo hint (mock data only) */}
        <div className={styles.demoBox}>
          <p id={DEMO_HINT_ID} className={styles.helperText}>
            Tài khoản demo: <strong>admin</strong> | Mật khẩu: <strong>123456</strong>
          </p>
          {mode === 'login' && (
            <button
              type="button"
              className={styles.demoFillBtn}
              onClick={() => {
                setFormData((prev) => ({ ...prev, userName: 'admin', password: '123456' }));
                setErrors({});
              }}
            >
              Điền nhanh
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          {mode === 'register' && (
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Họ</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nguyễn"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.inputField}
                  aria-invalid={errors.lastName ? true : undefined}
                  aria-describedby={errors.lastName ? 'auth-lastName-error' : DEMO_HINT_ID}
                />
                {errors.lastName ? <em id="auth-lastName-error" className={styles.feedbackError}>{errors.lastName}</em> : null}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Tên</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Văn A"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.inputField}
                  aria-invalid={errors.firstName ? true : undefined}
                  aria-describedby={errors.firstName ? 'auth-firstName-error' : DEMO_HINT_ID}
                />
                {errors.firstName ? <em id="auth-firstName-error" className={styles.feedbackError}>{errors.firstName}</em> : null}
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Tên tài khoản (Username)</label>
            <div className={styles.fieldWithIcon}>
              <User size={18} className={styles.fieldIcon} />
              <input
                type="text"
                name="userName"
                placeholder="VD: admin hoặc nguyenvana"
                value={formData.userName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.inputField}
                aria-invalid={errors.userName ? true : undefined}
                aria-describedby={errors.userName ? 'auth-userName-error' : DEMO_HINT_ID}
              />
            </div>
            {errors.userName ? <em id="auth-userName-error" className={styles.feedbackError}>{errors.userName}</em> : null}
          </div>

          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Địa chỉ Email</label>
              <div className={styles.fieldWithIcon}>
                <Mail size={18} className={styles.fieldIcon} />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.inputField}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'auth-email-error' : DEMO_HINT_ID}
                />
              </div>
              {errors.email ? <em id="auth-email-error" className={styles.feedbackError}>{errors.email}</em> : null}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Mật khẩu</label>
            <div className={styles.fieldWithIcon}>
              <Lock size={18} className={styles.fieldIcon} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.inputField}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'auth-password-error' : DEMO_HINT_ID}
              />
            </div>
            {errors.password ? <em id="auth-password-error" className={styles.feedbackError}>{errors.password}</em> : null}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản')}
          </button>
        </form>

        {/* Footer info */}
        <div className={styles.modalFooter}>
          <span className={styles.helperText}>
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              className={styles.switchModeBtn}
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setFeedback(null);
                setErrors({});
              }}
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
