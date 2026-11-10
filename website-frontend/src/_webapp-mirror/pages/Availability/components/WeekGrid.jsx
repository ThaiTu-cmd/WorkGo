import React from 'react';
import { WEEK_DAYS } from '../../../api/availabilityApi';
import { timeToMinutes } from '../../../api/availabilityApi';
import styles from '../AvailabilityPage.module.css';

export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 22;
const HOUR_PX = 48;

const minutesToPx = (min) => ((min - GRID_START_HOUR * 60) / 60) * HOUR_PX;

export default function WeekGrid({ rules, selectedRuleId, onSelectRule, onAddAt }) {
  const hours = [];
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h += 1) hours.push(h);
  const gridHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_PX;

  return (
    <div className={styles.gridScroller}>
      <div className={styles.weekGrid}>
        <div className={styles.timeCol}>
          <div className={styles.dayHead} aria-hidden="true" />
          <div className={styles.timeBody} style={{ height: gridHeight }}>
            {hours.map((h) => (
              <span key={h} className={styles.timeLabel} style={{ top: (h - GRID_START_HOUR) * HOUR_PX }}>
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>
        </div>

        {WEEK_DAYS.map((day) => {
          const dayRules = rules.filter((r) => r.dayOfWeek === day.value);
          const totalHours = dayRules
            .filter((r) => r.status === 'ACTIVE')
            .reduce((sum, r) => sum + (timeToMinutes(r.end) - timeToMinutes(r.start)) / 60, 0);
          return (
            <div key={day.value} className={styles.dayCol}>
              <div className={styles.dayHead}>
                <span className={styles.dayName}>{day.label}</span>
                <span className={styles.dayMeta}>{totalHours ? `${totalHours}h rảnh` : 'Nghỉ'}</span>
              </div>
              <div
                className={styles.dayBody}
                style={{ height: gridHeight, backgroundSize: `100% ${HOUR_PX}px` }}
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const y = e.nativeEvent.offsetY;
                  const hour = Math.min(GRID_END_HOUR - 1, GRID_START_HOUR + Math.floor(y / HOUR_PX));
                  onAddAt(day.value, hour);
                }}
                title="Bấm vào ô trống để thêm khung giờ"
              >
                {dayRules.map((rule) => {
                  const start = Math.max(timeToMinutes(rule.start), GRID_START_HOUR * 60);
                  const end = Math.min(timeToMinutes(rule.end), GRID_END_HOUR * 60);
                  if (end <= start) return null;
                  const slotPx = (rule.slotDurationMinute / 60) * HOUR_PX;
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      className={`${styles.ruleBlock} ${rule.status !== 'ACTIVE' ? styles.ruleInactive : ''} ${
                        selectedRuleId === rule.id ? styles.ruleSelected : ''
                      }`}
                      style={{
                        top: minutesToPx(start),
                        height: minutesToPx(end) - minutesToPx(start),
                        backgroundSize: `100% ${slotPx}px`,
                      }}
                      onClick={() => onSelectRule(rule)}
                      aria-label={`${day.label} ${rule.start}–${rule.end}, slot ${rule.slotDurationMinute} phút`}
                    >
                      <span className={styles.ruleTime}>
                        {rule.start} – {rule.end}
                      </span>
                      <span className={styles.ruleMeta}>
                        {rule.slotDurationMinute} phút/slot{rule.status !== 'ACTIVE' ? ' · Tạm tắt' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
