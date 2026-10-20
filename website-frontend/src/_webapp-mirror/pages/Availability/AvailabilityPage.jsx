import React, { useState } from 'react';
import { ArrowLeft, CalendarClock, Info, Loader2 } from 'lucide-react';
import { useAvailability } from '../../hooks/useAvailability';
import WeekGrid from './components/WeekGrid';
import RuleForm, { emptyRule } from './components/RuleForm';
import SlotList from './components/SlotList';
import styles from './AvailabilityPage.module.css';

const NOTICES = {
  'needs-login': 'Đăng nhập bằng tài khoản Chuyên gia để quản lý lịch rảnh.',
  forbidden: 'Tài khoản của bạn chưa có quyền Chuyên gia (PROVIDER) nên không có dịch vụ để đặt lịch rảnh.',
  error: 'Không kết nối được máy chủ — chưa tải được lịch rảnh.',
};

export default function AvailabilityPage({ onGoBack, onShowToast }) {
  const { status, isLive, busy, services, serviceId, setServiceId, rules, slots, saveRule, deleteRule } =
    useAvailability();
  const [editing, setEditing] = useState(() => emptyRule());
  const [saving, setSaving] = useState(false);

  const toast = (msg) => onShowToast && onShowToast(msg);

  const run = async (fn, okMsg) => {
    setSaving(true);
    try {
      await fn();
      toast(okMsg);
      setEditing(emptyRule(editing.dayOfWeek));
    } catch (err) {
      toast(`Không lưu được: ${err?.message || 'lỗi máy chủ'}`);
    } finally {
      setSaving(false);
    }
  };

  const activeHours = rules
    .filter((r) => r.status === 'ACTIVE')
    .reduce((sum, r) => {
      const [sh, sm] = r.start.split(':').map(Number);
      const [eh, em] = r.end.split(':').map(Number);
      return sum + (eh * 60 + em - sh * 60 - sm) / 60;
    }, 0);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.breadcrumbNav}>
          <button type="button" className={styles.backBtn} onClick={onGoBack}>
            <ArrowLeft size={16} /> Quản lý dịch vụ
          </button>
          <span className={styles.bcSep}>/</span>
          <span>Kênh Chuyên gia</span>
          <span className={styles.bcSep}>/</span>
          <span className={styles.bcCurrent}>Lịch rảnh</span>
        </div>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <CalendarClock size={26} className={styles.titleIcon} /> Lịch rảnh
            </h1>
            <p className={styles.pageSubtitle}>
              Thiết lập khung giờ nhận lịch hằng tuần. Hệ thống chia mỗi khung thành các Booking Slot để khách đặt.
            </p>
          </div>

          <div className={styles.servicePicker}>
            <label htmlFor="availability-service">Dịch vụ</label>
            <select
              id="availability-service"
              value={serviceId ?? ''}
              onChange={(e) => {
                setServiceId(e.target.value);
                setEditing(emptyRule());
              }}
              disabled={status === 'loading' || !services.length}
            >
              {services.length === 0 && <option value="">Chưa có dịch vụ</option>}
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {NOTICES[status] && (
          <div className={styles.notice} role="status">
            <Info size={16} /> <span>{NOTICES[status]}</span>
          </div>
        )}

        <div className={styles.summaryRow}>
          <span>
            <strong>{rules.length}</strong> khung giờ
          </span>
          <span>
            <strong>{activeHours}</strong> giờ rảnh / tuần
          </span>
          <span className={isLive ? styles.liveDot : styles.mockDot}>{isLive ? 'Dữ liệu máy chủ' : 'Chưa có dữ liệu'}</span>
          {(busy || status === 'loading') && <Loader2 size={16} className={styles.spin} aria-label="Đang tải" />}
        </div>

        <div className={styles.layout}>
          <div className={styles.gridCard}>
            <WeekGrid
              rules={rules}
              selectedRuleId={editing.id}
              onSelectRule={(r) => setEditing(r)}
              onAddAt={(day, hour) => setEditing(emptyRule(day, hour))}
            />
          </div>

          <aside className={styles.sidePanels}>
            <RuleForm
              rule={editing}
              rules={rules}
              saving={saving}
              onCancel={() => setEditing(emptyRule(editing.dayOfWeek))}
              onSave={(rule) =>
                run(() => saveRule(rule), rule.id ? 'Đã cập nhật khung giờ' : 'Đã thêm khung giờ mới')
              }
              onDelete={(id) => run(() => deleteRule(id), 'Đã xoá khung giờ')}
            />
            <SlotList slots={slots} />
          </aside>
        </div>
      </div>
    </div>
  );
}
