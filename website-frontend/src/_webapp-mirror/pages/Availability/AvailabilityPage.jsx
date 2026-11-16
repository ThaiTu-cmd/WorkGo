import { useTranslations } from "next-intl";
import React, { useState } from 'react';
import { ArrowLeft, CalendarClock, Info, Loader2 } from 'lucide-react';
import { useAvailability } from '../../hooks/useAvailability';
import { catalogErrorMessage } from '../../api/catalogApi';
import WeekGrid from './components/WeekGrid';
import RuleForm, { emptyRule } from './components/RuleForm';
import SlotList from './components/SlotList';
import styles from './AvailabilityPage.module.css';
// Keys of the "misc" dictionary, translated with tr() at render.
const NOTICES = {
  'needs-login': 'm1627',
  forbidden: 'm1628',
  error: 'm1629'
};
export default function AvailabilityPage({
  onGoBack,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const {
    status,
    isLive,
    busy,
    services,
    serviceId,
    setServiceId,
    rules,
    slots,
    saveRule,
    deleteRule
  } = useAvailability();
  const [editing, setEditing] = useState(() => emptyRule());
  const [saving, setSaving] = useState(false);
  const toast = msg => onShowToast && onShowToast(msg);
  const run = async (fn, okMsg) => {
    setSaving(true);
    try {
      await fn();
      toast(okMsg);
      setEditing(emptyRule(editing.dayOfWeek));
    } catch (err) {
      toast(tr("m169", {
        p0: catalogErrorMessage(err)
      }));
    } finally {
      setSaving(false);
    }
  };
  const activeHours = rules.filter(r => r.status === 'ACTIVE').reduce((sum, r) => {
    const [sh, sm] = r.start.split(':').map(Number);
    const [eh, em] = r.end.split(':').map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);
  return <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.breadcrumbNav}>
          <button type="button" className={styles.backBtn} onClick={onGoBack}>
            <ArrowLeft size={16} />{tr("m176")}</button>
          <span className={styles.bcSep}>/</span>
          <span>{tr("m177")}</span>
          <span className={styles.bcSep}>/</span>
          <span className={styles.bcCurrent}>{tr("m178")}</span>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <CalendarClock size={26} className={styles.titleIcon} />{tr("m178")}</h1>
            <p className={styles.pageSubtitle}>{tr("m179")}</p>
          </div>

          <div className={styles.servicePicker}>
            <label htmlFor="availability-service">{tr("m84")}</label>
            <select id="availability-service" value={serviceId ?? ''} onChange={e => {
            setServiceId(e.target.value);
            setEditing(emptyRule());
          }} disabled={status === 'loading' || !services.length}>
              {services.length === 0 && <option value="">{tr("m180")}</option>}
              {services.map(s => <option key={s.serviceId} value={s.serviceId}>
                  {s.title}
                </option>)}
            </select>
          </div>
        </div>

        {NOTICES[status] && <div className={styles.notice} role="status">
            <Info size={16} /> <span>{tr(NOTICES[status])}</span>
          </div>}

        <div className={styles.summaryRow}>
          <span>
            <strong>{rules.length}</strong> khung giờ
          </span>
          <span>
            <strong>{activeHours}</strong>{tr("m181")}</span>
          <span className={isLive ? styles.liveDot : styles.mockDot}>{isLive ? tr("m170") : tr("m171")}</span>
          {(busy || status === 'loading') && <Loader2 size={16} className={styles.spin} aria-label={tr("m172")} />}
        </div>

        <div className={styles.layout}>
          <div className={styles.gridCard}>
            <WeekGrid rules={rules} selectedRuleId={editing.id} onSelectRule={r => setEditing(r)} onAddAt={(day, hour) => setEditing(emptyRule(day, hour))} />
          </div>

          <aside className={styles.sidePanels}>
            <RuleForm rule={editing} rules={rules} saving={saving} onCancel={() => setEditing(emptyRule(editing.dayOfWeek))} onSave={rule => run(() => saveRule(rule), rule.id ? tr("m173") : tr("m174"))} onDelete={id => run(() => deleteRule(id), tr("m175"))} />
            <SlotList slots={slots} />
          </aside>
        </div>
      </div>
    </div>;
}