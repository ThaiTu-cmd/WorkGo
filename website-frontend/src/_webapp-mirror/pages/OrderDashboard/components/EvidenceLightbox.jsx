import { useTranslations } from "next-intl";
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from 'lucide-react';
import { phaseOf } from '../../../api/evidenceApi';
import { orderApi } from '../../../api/orderApi';
import styles from './WorkEvidence.module.css';
export const formatTime = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short'
}).format(new Date(iso)) : '—';

// Full-size view of one evidence photo with its phase, times and GPS position.
export default function EvidenceLightbox({
  orderId,
  items,
  index,
  onChange,
  onClose
}) {
  const tr = useTranslations("misc");
  const t = useTranslations('orderWorkspace');
  const item = items[index];
  const fileId = item.storedFileId;
  const [photo, setPhoto] = useState(null);
  const [retry, setRetry] = useState(0);
  const loadedPhoto = photo?.fileId === fileId && photo?.retry === retry ? photo : null;
  const src = fileId ? loadedPhoto?.url : item.fileUrl;
  const phase = phaseOf(item.phase);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const hasGps = item.latitude != null && item.longitude != null;
  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    let url;
    orderApi.downloadFile(orderId, fileId).then(blob => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      setPhoto({ fileId, retry, url });
    }).catch(() => {
      if (!cancelled) setPhoto({ fileId, retry, error: true });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [orderId, fileId, retry]);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChange(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, hasPrev, hasNext, onChange, onClose]);
  return <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={tr("m687")} onClick={onClose}>
      <div className={styles.lightboxBody} onClick={e => e.stopPropagation()}>
        <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label={tr("m688")} autoFocus>
          <X size={20} />
        </button>

        <div className={styles.lightboxStage}>
          {hasPrev && <button type="button" className={`${styles.navBtn} ${styles.navPrev}`} onClick={() => onChange(index - 1)} aria-label={tr("m689")}>
              <ChevronLeft size={22} />
            </button>}
          {src && <img src={src} alt={tr("m690", {
          p0: phase.label
        })} className={styles.lightboxImg} />}
          {fileId && !loadedPhoto && <span role="status">{t('downloading')}</span>}
          {loadedPhoto?.error && <div role="alert">
              <p>{t('downloadError')}</p>
              <button type="button" className={styles.secondaryBtn} onClick={() => setRetry(value => value + 1)}>{tr("m604")}</button>
            </div>}
          {hasNext && <button type="button" className={`${styles.navBtn} ${styles.navNext}`} onClick={() => onChange(index + 1)} aria-label={tr("m691")}>
              <ChevronRight size={22} />
            </button>}
        </div>

        <div className={styles.lightboxInfo}>
          <span className={`${styles.phaseChip} ${styles.phaseChipStatic} ${styles[`tone_${phase.tone}`]}`}>
            {phase.label}
          </span>
          <dl className={styles.infoList}>
            <div>
              <dt>{tr("m693")}</dt>
              <dd>{formatTime(item.capturedAt)}</dd>
            </div>
            <div>
              <dt>{tr("m694")}</dt>
              <dd>{formatTime(item.createdAt)}</dd>
            </div>
            <div>
              <dt>{tr("m695")}</dt>
              <dd>
                {hasGps ? <a href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                    <MapPin size={13} aria-hidden="true" />
                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a> : tr("m692")}
              </dd>
            </div>
          </dl>
          <span className={styles.counter}>
            {index + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>;
}
