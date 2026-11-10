import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, Loader2, MapPin, MapPinOff, X } from 'lucide-react';
import { EVIDENCE_PHASES, evidenceApi, evidenceErrorMessage } from '../../../api/evidenceApi';
import { compressImage } from '../../../utils/compressImage';
import styles from './WorkEvidence.module.css';

// A photo is treated as "just taken" when its file is younger than this,
// so its lastModified time can stand in for the capture time.
const FRESH_PHOTO_MS = 24 * 60 * 60 * 1000;

// Provider uploads one evidence photo: pick a phase, take or choose a photo
// (compressed in the browser), attach the device position when allowed.
export default function EvidenceUploadDialog({ orderId, defaultPhase, onClose, onCreated }) {
  const [phase, setPhase] = useState(defaultPhase);
  const [photo, setPhoto] = useState(null); // { dataUrl, capturedAt }
  const [preparing, setPreparing] = useState(false);
  const [geo, setGeo] = useState({ status: 'loading' }); // loading | ok | denied
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ status: 'denied' });
      return undefined;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setGeo({ status: 'ok', latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        if (!cancelled) setGeo({ status: 'denied' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setPreparing(true);
    try {
      const dataUrl = await compressImage(file);
      const fresh = Date.now() - file.lastModified < FRESH_PHOTO_MS;
      setPhoto({ dataUrl, capturedAt: new Date(fresh ? file.lastModified : Date.now()).toISOString() });
    } catch (err) {
      setError(err.message);
    } finally {
      setPreparing(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo) return setError('Vui lòng chụp hoặc chọn một ảnh.');
    setSubmitting(true);
    setError('');
    try {
      await evidenceApi.createEvidence(orderId, {
        phase,
        fileUrl: photo.dataUrl,
        capturedAt: photo.capturedAt,
        ...(geo.status === 'ok' ? { latitude: geo.latitude, longitude: geo.longitude } : {}),
      });
      onCreated();
    } catch (err) {
      setError(evidenceErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => !submitting && onClose()}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.dialogHeader}>
          <h3 id="evidence-dialog-title">Thêm bằng chứng làm việc</h3>
          <button type="button" className={styles.iconBtn} onClick={onClose} disabled={submitting} aria-label="Đóng">
            <X size={18} />
          </button>
        </header>

        <div className={styles.dialogBody}>
          <fieldset className={styles.field}>
            <legend>Giai đoạn</legend>
            <div className={styles.segmented}>
              {EVIDENCE_PHASES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={phase === p.value}
                  className={`${styles.segment} ${phase === p.value ? styles[`segmentActive_${p.tone}`] : ''}`}
                  onClick={() => setPhase(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <span className={styles.label}>Ảnh</span>
            {photo ? (
              <div className={styles.preview}>
                <img src={photo.dataUrl} alt="Ảnh sẽ gửi" />
                <button type="button" className={styles.changeBtn} onClick={() => fileRef.current?.click()}>
                  Đổi ảnh
                </button>
              </div>
            ) : (
              <div className={styles.dropzone}>
                {preparing ? (
                  <span className={styles.dropHint}>
                    <Loader2 size={18} className={styles.spin} aria-hidden="true" /> Đang xử lý ảnh...
                  </span>
                ) : (
                  <>
                    <button type="button" className={styles.pickBtn} onClick={() => cameraRef.current?.click()}>
                      <Camera size={20} aria-hidden="true" /> Chụp ảnh
                    </button>
                    <button type="button" className={styles.pickBtn} onClick={() => fileRef.current?.click()}>
                      <ImagePlus size={20} aria-hidden="true" /> Chọn từ máy
                    </button>
                  </>
                )}
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          </div>

          <p className={`${styles.geo} ${geo.status === 'ok' ? styles.geoOk : ''}`} role="status">
            {geo.status === 'loading' && (
              <>
                <Loader2 size={14} className={styles.spin} aria-hidden="true" /> Đang lấy vị trí...
              </>
            )}
            {geo.status === 'ok' && (
              <>
                <CheckCircle2 size={14} aria-hidden="true" />
                <MapPin size={14} aria-hidden="true" />
                Đã gắn vị trí {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)}
              </>
            )}
            {geo.status === 'denied' && (
              <>
                <MapPinOff size={14} aria-hidden="true" /> Không lấy được vị trí. Vẫn có thể gửi ảnh không kèm vị trí.
              </>
            )}
          </p>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className={styles.dialogFooter}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={!photo || submitting || preparing}
          >
            {submitting && <Loader2 size={15} className={styles.spin} aria-hidden="true" />}
            {submitting ? 'Đang gửi...' : 'Gửi bằng chứng'}
          </button>
        </footer>
      </div>
    </div>
  );
}
