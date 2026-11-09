import { useTranslations } from "next-intl";
import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './AuthModal.module.css';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import axiosClient, { setAccessToken } from '../../../api/axiosClient';
import { authApi } from '../../../api/authApi';
export default function AuthModal({
  initialMode = 'login',
  onClose,
  onLoginSuccess
}) {
  const tr = useTranslations("misc");
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
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    if (closeBtnRef.current) closeBtnRef.current.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const cleanUserName = (formData.userName || '').trim();
    const cleanEmail = (formData.email || '').trim();
    const cleanFirstName = (formData.firstName || '').trim();
    const cleanLastName = (formData.lastName || '').trim();
    if (mode === 'login') {
      try {
        const res = await axiosClient.post('/identity/auth/token', {
          userName: cleanUserName,
          password: formData.password
        });
        const token = res?.result?.token;
        if (!token) throw new Error(tr("m9"));
        setAccessToken(token);
        setFeedback({
          type: 'success',
          message: tr("m10", {
            p0: cleanUserName
          })
        });
        // Show the welcome feedback briefly, then close and let the shell land
        // on the signed-in default view (catalog).
        setTimeout(() => {
          onClose();
          onLoginSuccess && onLoginSuccess();
        }, 800);
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err?.status === 401 || err?.status === 400 || err?.status === 404 ? tr("m11") : err?.status === 0 || err?.status && err.status >= 500 ? tr("m12") : tr("m1448", {
            p0: err?.message || tr("m1303")
          })
        });
      }
    } else {
      try {
        // identity-service has no role field on registration (see BACKEND_GAPS.md).
        await authApi.register({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          userName: cleanUserName,
          password: formData.password,
          email: cleanEmail
        });
        setFeedback({
          type: 'success',
          message: tr("m14")
        });
        setTimeout(() => setMode('login'), 1000);
      } catch (err) {
        setFeedback({
          type: 'error',
          message: tr("m1449", {
            p0: err?.message || tr("m1303")
          })
        });
      }
    }
    setLoading(false);
  };
  return <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} ref={trapRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={mode === 'login' ? tr("m16") : tr("m17")}>
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
            {mode === 'login' ? tr("m16") : tr("m17")}
          </h2>
          <p className={styles.modalSubtitle}>
            {mode === 'login' ? tr("m18") : tr("m19")}
          </p>
        </div>

        {/* Tab switch */}
        <div className={styles.tabToggle}>
          <button type="button" className={`${styles.tabBtn} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => {
          setMode('login');
          setFeedback(null);
        }}>{tr("m32")}</button>
          <button type="button" className={`${styles.tabBtn} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => {
          setMode('register');
          setFeedback(null);
        }}>{tr("m36")}</button>
        </div>

        {/* Notification feedback */}
        {feedback && <div className={`${styles.feedbackBox} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.authForm}>
          {mode === 'register' && <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>{tr("m37")}</label>
                <input type="text" name="lastName" required placeholder={tr("m20")} value={formData.lastName} onChange={handleChange} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>{tr("m38")}</label>
                <input type="text" name="firstName" required placeholder={tr("m21")} value={formData.firstName} onChange={handleChange} className={styles.inputField} />
              </div>
            </div>}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              {mode === 'login' ? tr("m22") : tr("m23")}
            </label>
            <div className={styles.fieldWithIcon}>
              <User size={18} className={styles.fieldIcon} />
              <input type="text" name="userName" required placeholder={mode === 'login' ? tr("m24") : tr("m25")} value={formData.userName} onChange={handleChange} className={styles.inputField} />
            </div>
          </div>

          {mode === 'register' && <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>{tr("m40")}</label>
              <div className={styles.fieldWithIcon}>
                <Mail size={18} className={styles.fieldIcon} />
                <input type="email" name="email" required placeholder="name@example.com" value={formData.email} onChange={handleChange} className={styles.inputField} />
              </div>
            </div>}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>{tr("m41")}</label>
            <div className={styles.fieldWithIcon}>
              <Lock size={18} className={styles.fieldIcon} />
              <input type="password" name="password" required placeholder="••••••••" value={formData.password} onChange={handleChange} className={styles.inputField} />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? tr("m26") : mode === 'login' ? tr("m27") : tr("m28")}
          </button>
        </form>

        {/* Footer info */}
        <div className={styles.modalFooter}>
          <span className={styles.helperText}>
            {mode === 'login' ? tr("m29") : tr("m30")}
            <button type="button" className={styles.switchModeBtn} onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setFeedback(null);
          }}>
              {mode === 'login' ? tr("m31") : tr("m32")}
            </button>
          </span>
        </div>
      </div>
    </div>;
}