import { useTranslations } from "next-intl";
import React from 'react';
import styles from '../AvailabilityPage.module.css';
const STATUS = {
  AVAILABLE: {
    label: "Still empty",
    cls: styles.slotAvailable
  },
  HELD: {
    label: "Holding",
    cls: styles.slotHeld
  },
  BOOKED: {
    label: "Booked",
    cls: styles.slotBooked
  }
};
const fmtTime = iso => new Date(iso).toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit'
});
const fmtDay = iso => new Date(iso).toLocaleDateString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit'
});
export default function SlotList({
  slots
}) {
  const tr = useTranslations("misc");
  const sorted = [...slots].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  const groups = sorted.reduce((acc, s) => {
    const key = fmtDay(s.startedAt);
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  return <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{tr("m204")}</h2>
      </div>
      <div className={styles.legend}>
        {Object.entries(STATUS).map(([key, s]) => <span key={key} className={`${styles.slotBadge} ${s.cls}`}>
            {s.label}
          </span>)}
      </div>

      {sorted.length === 0 ? <p className={styles.emptyText}>{tr("m205")}</p> : <div className={styles.slotGroups}>
          {Object.entries(groups).map(([dayLabel, items]) => <div key={dayLabel}>
              <p className={styles.slotDay}>{dayLabel}</p>
              <ul className={styles.slotList}>
                {items.map(s => {
            const st = STATUS[s.status] ?? STATUS.AVAILABLE;
            return <li key={s.bookingSlotId} className={styles.slotItem}>
                      <span>
                        {fmtTime(s.startedAt)} – {fmtTime(s.endAt)}
                      </span>
                      <span className={`${styles.slotBadge} ${st.cls}`}>{st.label}</span>
                    </li>;
          })}
              </ul>
            </div>)}
        </div>}
    </section>;
}