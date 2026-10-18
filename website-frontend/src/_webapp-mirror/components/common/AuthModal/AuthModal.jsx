import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './AuthModal.module.css';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import axiosClient, { setAccessToken } from '../../../api/axiosClient';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'CLIENT'
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    if (mode === 'login') {
      try {
        const res = await axiosClient.post('/identity/auth/token', {
          userName: formData.userName,
          password: formData.password,
        });
        const token = res?.result?.token;
        if (!token) throw new Error('Phản hồi đăng nhập không có token');
        setAccessToken(token);
        setFeedback({
          type: 'success',
          message: `Đăng nhập thành công! Chào mừng ${formData.userName}.`
        });
        setTimeout(() => {
          onClose();
        }, 1000);
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err?.status === 401 || err?.status === 400 || err?.status === 404
              ? 'Sai tên đăng nhập hoặc mật khẩu.'
              : `Không đăng nhập được: ${err?.message || 'lỗi kết nối máy chủ'}`
        });
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setFeedback({
        type: 'success',
        message: 'Đăng ký tài khoản thành công (Demo)! Bạn có thể đăng nhập ngay.'
      });
      setTimeout(() => setMode('login'), 1000);
    }
    setLoading(false);
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
            onClick={() => { setMode('login'); setFeedback(null); }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => { setMode('register'); setFeedback(null); }}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.authForm}>
          {mode === 'register' && (
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Họ</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Nguyễn"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={styles.inputField}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Tên</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="Văn A"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={styles.inputField}
                />
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
                required
                placeholder="VD: admin hoặc nguyenvana"
                value={formData.userName}
                onChange={handleChange}
                className={styles.inputField}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Địa chỉ Email</label>
              <div className={styles.fieldWithIcon}>
                <Mail size={18} className={styles.fieldIcon} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.inputField}
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Mật khẩu</label>
            <div className={styles.fieldWithIcon}>
              <Lock size={18} className={styles.fieldIcon} />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={styles.inputField}
              />
            </div>
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
