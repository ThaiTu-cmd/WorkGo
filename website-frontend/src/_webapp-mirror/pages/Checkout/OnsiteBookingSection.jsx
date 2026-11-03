import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Loader2, MapPin } from 'lucide-react';
import { availabilityApi } from '../../api/availabilityApi';
import { addressApi } from '../../api/addressApi';
import { pageItems, toAddress } from '../../api/adapters';
import styles from './OnsiteBookingSection.module.css';

const dayFormat = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

// A slot can be booked when it is free, or when another order's 30-minute hold lapsed.
const isBookable = (slot, now) =>
  new Date(slot.startedAt).getTime() > now &&
  (slot.status === 'AVAILABLE' ||
    (slot.status === 'HELD' && slot.holdExpiresAt && new Date(slot.holdExpiresAt).getTime() <= now));

// ONSITE checkout needs a booking slot and an address (order-service rejects
// the order otherwise). `value` = { slot, address } chosen so far.
export default function OnsiteBookingSection({ serviceId, value, onChange, onOpenAddressBook }) {
  const [slots, setSlots] = useState({ status: 'loading', items: [] });
  const [addresses, setAddresses] = useState({ status: 'loading', items: [] });

  useEffect(() => {
    let cancelled = false;
    availabilityApi.getSlots(serviceId, 0, 100).then(
      (res) => !cancelled && setSlots({ status: 'ready', items: pageItems(res) }),
      () => !cancelled && setSlots({ status: 'error', items: [] })
    );
    addressApi.getMy().then(
      (res) => !cancelled && setAddresses({ status: 'ready', items: pageItems(res).map(toAddress) }),
      () => !cancelled && setAddresses({ status: 'error', items: [] })
    );
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  // Bookable slots grouped by day, soonest first.
  const days = useMemo(() => {
    const now = Date.now();
    const groups = new Map();
    slots.items
      .filter((s) => isBookable(s, now))
      .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
      .forEach((s) => {
        const day = dayFormat.format(new Date(s.startedAt));
        if (!groups.has(day)) groups.set(day, []);
        groups.get(day).push(s);
      });
    return [...groups.entries()];
  }, [slots.items]);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Lịch hẹn &amp; địa chỉ</h2>
      <p className={styles.sub}>Chuyên gia sẽ đến địa chỉ của bạn vào khung giờ đã chọn.</p>

      <h3 className={styles.label}>
        <CalendarClock size={16} aria-hidden="true" /> Khung giờ
      </h3>
      {slots.status === 'loading' && (
        <p className={styles.muted}>
          <Loader2 size={14} className={styles.spinner} /> Đang tải lịch trống...
        </p>
      )}
      {slots.status === 'error' && <p className={styles.muted}>Không tải được lịch của chuyên gia.</p>}
      {slots.status === 'ready' && days.length === 0 && (
        <p className={styles.muted}>Chuyên gia chưa có khung giờ trống nào. Hãy nhắn tin để hẹn lịch.</p>
      )}
      {days.map(([day, daySlots]) => (
        <div key={day} className={styles.day}>
          <p className={styles.dayLabel}>{day}</p>
          <div className={styles.slotGrid} role="radiogroup" aria-label={`Khung giờ ${day}`}>
            {daySlots.map((s) => {
              const selected = value.slot?.bookingSlotId === s.bookingSlotId;
              return (
                <button
                  key={s.bookingSlotId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`${styles.slot} ${selected ? styles.selected : ''}`}
                  onClick={() => onChange({ ...value, slot: s })}
                >
                  {timeFormat.format(new Date(s.startedAt))} – {timeFormat.format(new Date(s.endAt))}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <h3 className={styles.label}>
        <MapPin size={16} aria-hidden="true" /> Địa chỉ thực hiện
      </h3>
      {addresses.status === 'loading' && <p className={styles.muted}>Đang tải sổ địa chỉ...</p>}
      {addresses.status === 'error' && <p className={styles.muted}>Không tải được sổ địa chỉ.</p>}
      {addresses.status === 'ready' && addresses.items.length === 0 && (
        <p className={styles.muted}>
          Bạn chưa lưu địa chỉ nào.{' '}
          {onOpenAddressBook && (
            <button type="button" className={styles.link} onClick={onOpenAddressBook}>
              Thêm địa chỉ
            </button>
          )}
        </p>
      )}
      <div className={styles.addressList} role="radiogroup" aria-label="Địa chỉ thực hiện">
        {addresses.items.map((a) => {
          const selected = value.address?.id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`${styles.address} ${selected ? styles.selected : ''}`}
              onClick={() => onChange({ ...value, address: a })}
            >
              <strong>{a.label || a.receiver || 'Địa chỉ'}</strong>
              <span>{a.detail}</span>
              {(a.receiver || a.phone) && (
                <small>{[a.receiver, a.phone].filter(Boolean).join(' · ')}</small>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// The single-line address order-service snapshots on the order.
export const formatOrderAddress = (a) =>
  [a.detail, [a.receiver, a.phone].filter(Boolean).join(' - ')].filter(Boolean).join(' | ');
