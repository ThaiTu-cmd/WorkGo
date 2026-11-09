import { useTranslations } from "next-intl";
import React, { useState } from 'react';
import { Camera, Images, MapPin, RefreshCw } from 'lucide-react';
import { EVIDENCE_PHASES, phaseOf } from '../../../api/evidenceApi';
import { useWorkEvidence } from '../../../hooks/useWorkEvidence';
import EvidenceUploadDialog from './EvidenceUploadDialog';
import EvidenceLightbox, { formatTime } from './EvidenceLightbox';
import styles from './WorkEvidence.module.css';
const TABS = [{
  value: 'ALL',
  label: "All"
}, ...EVIDENCE_PHASES];

// Photos the provider takes on site (before / during / after / issue) for an
// ONSITE order. The provider adds them while the job is in service; the client
// reviews them here before accepting the work.
export default function WorkEvidencePanel({
  orderId,
  role,
  orderStatus,
  onsiteStatus,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const {
    status,
    items,
    counts,
    error,
    reload
  } = useWorkEvidence(orderId);
  const [tab, setTab] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(null);
  const isProvider = role === 'PROVIDER';
  const canUpload = isProvider && orderStatus === 'IN_PROGRESS' && onsiteStatus === 'IN_SERVICE';
  const visible = tab === 'ALL' ? items : items.filter(e => e.phase === tab);

  // Suggest the first phase that has no photo yet (BEFORE → DURING → AFTER).
  const nextPhase = ['BEFORE', 'DURING', 'AFTER'].find(p => !counts[p]) ?? 'AFTER';
  const handleCreated = () => {
    setDialogOpen(false);
    onShowToast?.(tr("m794"));
    reload();
  };
  return <section className={styles.panel} aria-label={tr("m795")}>
      <header className={styles.header}>
        <div>
          <strong className={styles.title}>
            <Images size={16} aria-hidden="true" />{tr("m795")}{status === 'ready' && <span className={styles.count}>{counts.ALL}</span>}
          </strong>
          <p className={styles.subtitle}>
            {isProvider ? tr("m796") : tr("m797")}
          </p>
        </div>
        {isProvider && <span className={styles.addWrap} title={canUpload ? undefined : tr("m798")}>
            <button type="button" className={styles.addBtn} disabled={!canUpload} onClick={() => setDialogOpen(true)}>
              <Camera size={15} aria-hidden="true" />{tr("m809")}</button>
          </span>}
      </header>

      {isProvider && !canUpload && <p className={styles.hint}>{tr("m810")}</p>}

      <div className={styles.tabs} role="tablist" aria-label={tr("m799")}>
        {TABS.map(t => <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} className={`${styles.tab} ${tab === t.value ? styles.tabActive : ''} ${t.tone === 'warning' ? styles.tabWarning : ''}`} onClick={() => setTab(t.value)}>
            {t.label}
            <span className={styles.tabCount}>{status === 'ready' ? counts[t.value] : '·'}</span>
          </button>)}
      </div>

      {status === 'loading' && <div className={styles.grid} aria-busy="true">
          {[0, 1, 2, 3].map(i => <div key={i} className={`${styles.tile} ${styles.skeleton}`} />)}
        </div>}

      {status === 'error' && <div className={styles.empty}>
          <p>{error?.message || tr("m800")}</p>
          <button type="button" className={styles.linkBtn} onClick={reload}>
            <RefreshCw size={14} aria-hidden="true" />{tr("m604")}</button>
        </div>}

      {status === 'ready' && visible.length === 0 && <div className={styles.empty}>
          <Camera size={22} aria-hidden="true" />
          <p>
            {tab !== 'ALL' ? tr("m801", {
          p0: phaseOf(tab).label
        }) : isProvider ? tr("m802") : tr("m803")}
          </p>
        </div>}

      {status === 'ready' && visible.length > 0 && <ul className={styles.grid}>
          {visible.map((e, i) => {
        const phase = phaseOf(e.phase);
        return <li key={e.workEvidenceId}>
                <button type="button" className={styles.tile} onClick={() => setViewIndex(i)} aria-label={tr("m804", {
            p0: phase.label,
            p1: formatTime(e.capturedAt)
          })}>
                  <img src={e.fileUrl} alt="" loading="lazy" className={styles.tileImg} />
                  <span className={`${styles.phaseChip} ${styles[`tone_${phase.tone}`]}`}>{phase.short}</span>
                  <span className={styles.tileMeta}>
                    {formatTime(e.capturedAt)}
                    {e.latitude != null && e.longitude != null && <MapPin size={12} aria-label={tr("m805")} />}
                  </span>
                </button>
              </li>;
      })}
        </ul>}

      {dialogOpen && <EvidenceUploadDialog orderId={orderId} defaultPhase={nextPhase} onClose={() => setDialogOpen(false)} onCreated={handleCreated} />}

      {viewIndex != null && visible[viewIndex] && <EvidenceLightbox items={visible} index={viewIndex} onChange={setViewIndex} onClose={() => setViewIndex(null)} />}
    </section>;
}