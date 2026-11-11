import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { orderErrorMessage } from '../../../api/orderApi';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import styles from './WorkEvidence.module.css';

// Modal shell shared by the order flow dialogs (check-in, requirements, delivery,
// revision). `onSubmit` is async; a thrown ApiError is shown inside the dialog and
// the dialog stays open. Without `onSubmit` it is an info dialog with one button.
export default function OrderFlowDialog({
  title,
  submitLabel,
  submittingLabel,
  canSubmit = true,
  onSubmit,
  onClose,
  closeLabel,
  children
}) {
  const tr = useTranslations("misc");
  submittingLabel ??= tr("m1618");
  closeLabel ??= tr("m1581");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);
  useEffect(() => {
    dialogRef.current?.querySelector(tr("m763"))?.focus();
  }, []);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!onSubmit || !canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit();
    } catch (err) {
      setError(orderErrorMessage(err));
      setSubmitting(false);
    }
  };
  return <div className={styles.overlay} onClick={() => !submitting && onClose()}>
      <form ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="order-flow-dialog-title" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className={styles.dialogHeader}>
          <h3 id="order-flow-dialog-title">{title}</h3>
          <button type="button" className={styles.iconBtn} onClick={onClose} disabled={submitting} aria-label={tr("m688")}>
            <X size={18} />
          </button>
        </header>

        <div className={styles.dialogBody}>
          {children}
          {error && <p className={styles.error} role="alert">
              {error}
            </p>}
        </div>

        <footer className={styles.dialogFooter}>
          {onSubmit ? <>
              <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={submitting}>
                {closeLabel}
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={!canSubmit || submitting}>
                {submitting && <Loader2 size={15} className={styles.spin} aria-hidden="true" />}
                {submitting ? submittingLabel : submitLabel}
              </button>
            </> : <button type="button" className={styles.primaryBtn} onClick={onClose}>
              {closeLabel}
            </button>}
        </footer>
      </form>
    </div>;
}