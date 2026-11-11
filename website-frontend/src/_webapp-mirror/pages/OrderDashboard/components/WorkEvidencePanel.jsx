import React, { useState } from 'react';
import { Camera, Images, MapPin, RefreshCw } from 'lucide-react';
import { EVIDENCE_PHASES, phaseOf } from '../../../api/evidenceApi';
import { useWorkEvidence } from '../../../hooks/useWorkEvidence';
import EvidenceUploadDialog from './EvidenceUploadDialog';
import EvidenceLightbox, { formatTime } from './EvidenceLightbox';
import styles from './WorkEvidence.module.css';

const TABS = [{ value: 'ALL', label: 'Tất cả' }, ...EVIDENCE_PHASES];

// Photos the provider takes on site (before / during / after / issue) for an
// ONSITE order. The provider adds them while the job is in service; the client
// reviews them here before accepting the work.
export default function WorkEvidencePanel({ orderId, role, orderStatus, onsiteStatus, onShowToast }) {
  const { status, items, counts, error, reload } = useWorkEvidence(orderId);
  const [tab, setTab] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);

  const isProvider = role === 'PROVIDER';
  const canUpload = isProvider && orderStatus === 'IN_PROGRESS' && onsiteStatus === 'IN_SERVICE';
  const visible = tab === 'ALL' ? items : items.filter((e) => e.phase === tab);

  // Suggest the first phase that has no photo yet (BEFORE → DURING → AFTER).
  const nextPhase = ['BEFORE', 'DURING', 'AFTER'].find((p) => !counts[p]) ?? 'AFTER';

  const handleCreated = () => {
    setDialogOpen(false);
    onShowToast?.('Đã gửi bằng chứng làm việc');
    reload();
  };

  return (
    <section className={styles.panel} aria-label="Bằng chứng làm việc">
      <header className={styles.header}>
        <div>
          <strong className={styles.title}>
            <Images size={16} aria-hidden="true" /> Bằng chứng làm việc
            {status === 'ready' && <span className={styles.count}>{counts.ALL}</span>}
          </strong>
          <p className={styles.subtitle}>
            {isProvider
              ? 'Chụp ảnh tại chỗ để khách theo dõi và làm căn cứ khi nghiệm thu.'
              : 'Ảnh chuyên gia chụp tại nhà bạn, kèm thời gian và vị trí.'}
          </p>
        </div>
        {isProvider && (
          <span
            className={styles.addWrap}
            title={canUpload ? undefined : 'Chỉ gửi được khi đang thực hiện tại nhà'}
          >
            <button
              type="button"
              className={styles.addBtn}
              disabled={!canUpload}
              onClick={() => setDialogOpen(true)}
            >
              <Camera size={15} aria-hidden="true" /> Thêm bằng chứng
            </button>
          </span>
        )}
      </header>

      {isProvider && !canUpload && (
        <p className={styles.hint}>Bạn có thể gửi bằng chứng khi đơn chuyển sang trạng thái đang thực hiện tại nhà.</p>
      )}

      <div className={styles.tabs} role="tablist" aria-label="Lọc theo giai đoạn">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`${styles.tab} ${tab === t.value ? styles.tabActive : ''} ${
              t.tone === 'warning' ? styles.tabWarning : ''
            }`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
            <span className={styles.tabCount}>{status === 'ready' ? counts[t.value] : '·'}</span>
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className={styles.grid} aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${styles.tile} ${styles.skeleton}`} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className={styles.empty}>
          <p>{error?.message || 'Không tải được bằng chứng.'}</p>
          <button type="button" className={styles.linkBtn} onClick={reload}>
            <RefreshCw size={14} aria-hidden="true" /> Thử lại
          </button>
        </div>
      )}

      {status === 'ready' && visible.length === 0 && (
        <div className={styles.empty}>
          <Camera size={22} aria-hidden="true" />
          <p>
            {tab !== 'ALL'
              ? `Chưa có ảnh ở giai đoạn "${phaseOf(tab).label}".`
              : isProvider
                ? 'Chưa có ảnh nào. Hãy chụp hiện trạng trước khi bắt đầu làm.'
                : 'Chuyên gia chưa gửi bằng chứng nào.'}
          </p>
        </div>
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className={styles.grid}>
          {visible.map((e, i) => {
            const phase = phaseOf(e.phase);
            return (
              <li key={e.workEvidenceId}>
                <button
                  type="button"
                  className={styles.tile}
                  onClick={() => setViewIndex(i)}
                  aria-label={`Xem ảnh ${phase.label}, chụp lúc ${formatTime(e.capturedAt)}`}
                >
                  <img src={e.fileUrl} alt="" loading="lazy" className={styles.tileImg} />
                  <span className={`${styles.phaseChip} ${styles[`tone_${phase.tone}`]}`}>{phase.short}</span>
                  <span className={styles.tileMeta}>
                    {formatTime(e.capturedAt)}
                    {e.latitude != null && e.longitude != null && (
                      <MapPin size={12} aria-label="Có vị trí GPS" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {dialogOpen && (
        <EvidenceUploadDialog
          orderId={orderId}
          defaultPhase={nextPhase}
          onClose={() => setDialogOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {viewIndex != null && visible[viewIndex] && (
        <EvidenceLightbox
          items={visible}
          index={viewIndex}
          onChange={setViewIndex}
          onClose={() => setViewIndex(null)}
        />
      )}
    </section>
  );
}
