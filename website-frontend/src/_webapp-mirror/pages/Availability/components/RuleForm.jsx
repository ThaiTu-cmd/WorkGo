import React, { useEffect, useState } from 'react';
import { Trash2, Save, Plus, X } from 'lucide-react';
import { WEEK_DAYS } from '../../../data/mockAvailability';
import { timeToMinutes } from '../../../api/availabilityApi';
import styles from '../AvailabilityPage.module.css';

const DURATIONS = [15, 30, 45, 60, 90, 120];

export const emptyRule = (dayOfWeek = 2, hour = 8) => ({
  id: null,
  dayOfWeek,
  start: `${String(hour).padStart(2, '0')}:00`,
  end: `${String(Math.min(hour + 2, 23)).padStart(2, '0')}:00`,
  slotDurationMinute: 60,
  status: 'ACTIVE',
});

export default function RuleForm({ rule, rules, saving, onSave, onDelete, onCancel }) {
  const [draft, setDraft] = useState(rule);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(rule);
    setError(null);
  }, [rule]);

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const validate = () => {
    const s = timeToMinutes(draft.start);
    const e = timeToMinutes(draft.end);
    if (e <= s) return 'Giờ kết thúc phải sau giờ bắt đầu.';
    if (e - s < draft.slotDurationMinute) return 'Khung giờ ngắn hơn độ dài một slot.';
    const clash = rules.find(
      (r) =>
        r.id !== draft.id &&
        r.dayOfWeek === draft.dayOfWeek &&
        s < timeToMinutes(r.end) &&
        e > timeToMinutes(r.start)
    );
    if (clash) return `Trùng với khung ${clash.start}–${clash.end} cùng ngày.`;
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = validate();
    setError(msg);
    if (!msg) onSave(draft);
  };

  const isEdit = Boolean(draft.id);

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{isEdit ? 'Sửa khung giờ' : 'Thêm khung giờ'}</h2>
        {isEdit && (
          <button type="button" className={styles.iconBtn} onClick={onCancel} aria-label="Bỏ chọn">
            <X size={16} />
          </button>
        )}
      </div>

      <label className={styles.field}>
        <span>Ngày trong tuần</span>
        <div className={styles.dayPicker}>
          {WEEK_DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`${styles.dayChip} ${draft.dayOfWeek === d.value ? styles.dayChipActive : ''}`}
              onClick={() => set('dayOfWeek', d.value)}
              aria-pressed={draft.dayOfWeek === d.value}
            >
              {d.short}
            </button>
          ))}
        </div>
      </label>

      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span>Bắt đầu</span>
          <input type="time" step="900" value={draft.start} onChange={(e) => set('start', e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Kết thúc</span>
          <input type="time" step="900" value={draft.end} onChange={(e) => set('end', e.target.value)} required />
        </label>
      </div>

      <label className={styles.field}>
        <span>Độ dài mỗi slot</span>
        <select value={draft.slotDurationMinute} onChange={(e) => set('slotDurationMinute', Number(e.target.value))}>
          {DURATIONS.map((m) => (
            <option key={m} value={m}>
              {m} phút
            </option>
          ))}
        </select>
      </label>

      <label className={styles.toggleRow}>
        <input
          type="checkbox"
          checked={draft.status === 'ACTIVE'}
          onChange={(e) => set('status', e.target.checked ? 'ACTIVE' : 'INACTIVE')}
        />
        <span>Đang mở nhận lịch</span>
      </label>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.panelActions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {isEdit ? <Save size={16} /> : <Plus size={16} />}
          {saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Thêm khung giờ'}
        </button>
        {isEdit && (
          <button
            type="button"
            className={styles.dangerBtn}
            disabled={saving}
            onClick={() => {
              if (window.confirm(`Xoá khung ${draft.start}–${draft.end}?`)) onDelete(draft.id);
            }}
          >
            <Trash2 size={16} /> Xoá
          </button>
        )}
      </div>
    </form>
  );
}
