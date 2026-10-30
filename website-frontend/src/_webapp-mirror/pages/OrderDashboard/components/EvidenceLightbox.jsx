import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from 'lucide-react';
import { phaseOf } from '../../../api/evidenceApi';
import styles from './WorkEvidence.module.css';

export const formatTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
    : '—';

// Full-size view of one evidence photo with its phase, times and GPS position.
export default function EvidenceLightbox({ items, index, onChange, onClose }) {
  const item = items[index];
  const phase = phaseOf(item.phase);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const hasGps = item.latitude != null && item.longitude != null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChange(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, hasPrev, hasNext, onChange, onClose]);

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Xem bằng chứng" onClick={onClose}>
      <div className={styles.lightboxBody} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label="Đóng" autoFocus>
          <X size={20} />
        </button>

        <div className={styles.lightboxStage}>
          {hasPrev && (
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={() => onChange(index - 1)}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <img src={item.fileUrl} alt={`Bằng chứng ${phase.label}`} className={styles.lightboxImg} />
          {hasNext && (
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={() => onChange(index + 1)}
              aria-label="Ảnh sau"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        <div className={styles.lightboxInfo}>
          <span className={`${styles.phaseChip} ${styles.phaseChipStatic} ${styles[`tone_${phase.tone}`]}`}>
            {phase.label}
          </span>
          <dl className={styles.infoList}>
            <div>
              <dt>Chụp lúc</dt>
              <dd>{formatTime(item.capturedAt)}</dd>
            </div>
            <div>
              <dt>Gửi lúc</dt>
              <dd>{formatTime(item.createdAt)}</dd>
            </div>
            <div>
              <dt>Vị trí</dt>
              <dd>
                {hasGps ? (
                  <a
                    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapLink}
                  >
                    <MapPin size={13} aria-hidden="true" />
                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : (
                  'Không có'
                )}
              </dd>
            </div>
          </dl>
          <span className={styles.counter}>
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
