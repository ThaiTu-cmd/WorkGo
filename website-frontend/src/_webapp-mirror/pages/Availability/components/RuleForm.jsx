import { useTranslations } from "next-intl";
import React, { useEffect, useState } from 'react';
import { Trash2, Save, Plus, X } from 'lucide-react';
import { WEEK_DAYS } from '../../../api/availabilityApi';
import { timeToMinutes } from '../../../api/availabilityApi';
import styles from '../AvailabilityPage.module.css';
const DURATIONS = [15, 30, 45, 60, 90, 120];
export const emptyRule = (dayOfWeek = 2, hour = 8) => ({
  id: null,
  dayOfWeek,
  start: `${String(hour).padStart(2, '0')}:00`,
  end: `${String(Math.min(hour + 2, 23)).padStart(2, '0')}:00`,
  slotDurationMinute: 60,
  status: 'ACTIVE'
});
export default function RuleForm({
  rule,
  rules,
  saving,
  onSave,
  onDelete,
  onCancel
}) {
  const tr = useTranslations("misc");
  const [draft, setDraft] = useState(rule);
  const [error, setError] = useState(null);
  useEffect(() => {
    setDraft(rule);
    setError(null);
  }, [rule]);
  const set = (key, value) => setDraft(d => ({
    ...d,
    [key]: value
  }));
  const validate = () => {
    const s = timeToMinutes(draft.start);
    const e = timeToMinutes(draft.end);
    if (e <= s) return tr("m183");
    if (e - s < draft.slotDurationMinute) return tr("m184");
    const clash = rules.find(r => r.id !== draft.id && r.dayOfWeek === draft.dayOfWeek && s < timeToMinutes(r.end) && e > timeToMinutes(r.start));
    if (clash) return tr("m185", {
      p0: clash.start,
      p1: clash.end
    });
    return null;
  };
  const handleSubmit = e => {
    e.preventDefault();
    const msg = validate();
    setError(msg);
    if (!msg) onSave(draft);
  };
  const isEdit = Boolean(draft.id);
  return <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{isEdit ? tr("m186") : tr("m187")}</h2>
        {isEdit && <button type="button" className={styles.iconBtn} onClick={onCancel} aria-label={tr("m188")}>
            <X size={16} />
          </button>}
      </div>

      <label className={styles.field}>
        <span>{tr("m193")}</span>
        <div className={styles.dayPicker}>
          {WEEK_DAYS.map(d => <button key={d.value} type="button" className={`${styles.dayChip} ${draft.dayOfWeek === d.value ? styles.dayChipActive : ''}`} onClick={() => set('dayOfWeek', d.value)} aria-pressed={draft.dayOfWeek === d.value}>
              {d.short}
            </button>)}
        </div>
      </label>

      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span>{tr("m194")}</span>
          <input type="time" step="900" value={draft.start} onChange={e => set('start', e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>{tr("m195")}</span>
          <input type="time" step="900" value={draft.end} onChange={e => set('end', e.target.value)} required />
        </label>
      </div>

      <label className={styles.field}>
        <span>{tr("m196")}</span>
        <select value={draft.slotDurationMinute} onChange={e => set('slotDurationMinute', Number(e.target.value))}>
          {DURATIONS.map(m => <option key={m} value={m}>
              {m}{tr("m1467")}</option>)}
        </select>
      </label>

      <label className={styles.toggleRow}>
        <input type="checkbox" checked={draft.status === 'ACTIVE'} onChange={e => set('status', e.target.checked ? 'ACTIVE' : 'INACTIVE')} />
        <span>{tr("m198")}</span>
      </label>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.panelActions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {isEdit ? <Save size={16} /> : <Plus size={16} />}
          {saving ? tr("m189") : isEdit ? tr("m190") : tr("m187")}
        </button>
        {isEdit && <button type="button" className={styles.dangerBtn} disabled={saving} onClick={() => {
        if (window.confirm(tr("m191", {
          p0: draft.start,
          p1: draft.end
        }))) onDelete(draft.id);
      }}>
            <Trash2 size={16} />{tr("m200")}</button>}
      </div>
    </form>;
}