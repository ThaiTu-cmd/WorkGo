import React, { useEffect, useState } from 'react';
import {
  MOCK_SERVICES,
  getSlots,
  holdSlot,
  confirmSlot,
  releaseSlot,
} from './mockBookingSlots.js';
import styles from './BookingSlotsPage.module.css';

/**
 * BookingSlotsPage: Trang Đặt lịch hẹn và Quản lý Slot giờ của Chuyên gia.
 * Hỗ trợ các trạng thái AVAILABLE -> HELD (giữ 30 phút) -> BOOKED (xác nhận) hoặc nhả lại AVAILABLE.
 */
export default function BookingSlotsPage({ onNavigate, onShowToast }) {
  const [selectedServiceId, setSelectedServiceId] = useState(MOCK_SERVICES[0].id);
  const [slots, setSlots] = useState([]);
  const [nowTime, setNowTime] = useState(Date.now());

  const loadSlots = () => {
    setNowTime(Date.now());
    const data = getSlots(selectedServiceId);
    setSlots(data);
  };

  useEffect(() => {
    loadSlots();

    // Cập nhật countdown mỗi 30s
    const timer = setInterval(() => {
      loadSlots();
    }, 30000);

    const handleSync = () => {
      loadSlots();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('workgo-slots-changed', handleSync);
    }

    return () => {
      clearInterval(timer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('workgo-slots-changed', handleSync);
      }
    };
  }, [selectedServiceId]);

  const handleHold = (slotId) => {
    const res = holdSlot(slotId, 30);
    if (res) {
      loadSlots();
      if (onShowToast) {
        onShowToast('Đã giữ chỗ trong 30 phút. Vui lòng xác nhận trước khi hết hạn!');
      }
    }
  };

  const handleConfirm = (slotId) => {
    const res = confirmSlot(slotId);
    if (res) {
      loadSlots();
      if (onShowToast) {
        onShowToast('Xác nhận đặt lịch thành công! Chuyên gia đã nhận được thông báo.');
      }
    }
  };

  const handleRelease = (slotId) => {
    if (releaseSlot(slotId)) {
      loadSlots();
      if (onShowToast) {
        onShowToast('Đã hủy giữ chỗ. Khung giờ hiện đã sẵn sàng cho người khác.');
      }
    }
  };

  const getRemainingMinutes = (holdExpiresAt) => {
    if (!holdExpiresAt) return 0;
    const diff = holdExpiresAt - nowTime;
    return Math.max(0, Math.ceil(diff / (60 * 1000)));
  };

  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // Gom nhóm slots theo ngày
  const slotsByDate = slots.reduce((acc, slot) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={styles.breadcrumbLink}
        >
          Trang chủ
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <button
          type="button"
          onClick={() => navigateTo('catalog')}
          className={styles.breadcrumbLink}
        >
          Dịch vụ
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Đặt lịch hẹn (Booking Slots)</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Quản lý & Đặt lịch hẹn chuyên gia</h1>
        <p className={styles.subtitle}>
          Đặt trước khung giờ tư vấn trực tuyến 1-1 với chuyên gia. Khung giờ được giữ tối đa 30 phút trong khi bạn hoàn tất thanh toán.
        </p>
      </header>

      {/* Service Selector */}
      <div className={styles.filterCard}>
        <label htmlFor="service-select" className={styles.filterLabel}>
          Chọn dịch vụ chuyên gia:
        </label>
        <select
          id="service-select"
          className={styles.select}
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
        >
          {MOCK_SERVICES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} — {s.provider}
            </option>
          ))}
        </select>
      </div>

      {/* Slots List */}
      <div className={styles.slotsArea}>
        {Object.keys(slotsByDate).length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>Chưa có khung giờ nào được thiết lập cho dịch vụ này.</p>
          </div>
        ) : (
          Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date} className={styles.dateGroup}>
              <h2 className={styles.dateHeading}>
                📅 Ngày: {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <div className={styles.slotsGrid}>
                {dateSlots.map((slot) => {
                  const remMinutes = getRemainingMinutes(slot.holdExpiresAt);

                  return (
                    <div
                      key={slot.id}
                      className={`
                        ${styles.slotCard}
                        ${slot.status === 'AVAILABLE' ? styles.slotAvailable : ''}
                        ${slot.status === 'HELD' ? styles.slotHeld : ''}
                        ${slot.status === 'BOOKED' ? styles.slotBooked : ''}
                      `}
                    >
                      <div className={styles.slotTime}>
                        ⏰ {slot.startTime} - {slot.endTime}
                      </div>

                      {/* Status Tag */}
                      <div className={styles.slotStatusRow}>
                        {slot.status === 'AVAILABLE' && (
                          <span className={styles.badgeAvailable}>Sẵn sàng (AVAILABLE)</span>
                        )}
                        {slot.status === 'HELD' && (
                          <span className={styles.badgeHeld}>
                            Đang giữ chỗ ({remMinutes > 0 ? `còn ${remMinutes} phút` : 'hết hạn'}) (HELD)
                          </span>
                        )}
                        {slot.status === 'BOOKED' && (
                          <span className={styles.badgeBooked}>Đã đặt (BOOKED)</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={styles.slotActions}>
                        {slot.status === 'AVAILABLE' && (
                          <button
                            type="button"
                            onClick={() => handleHold(slot.id)}
                            className={styles.btnPrimary}
                          >
                            Giữ chỗ 30 phút
                          </button>
                        )}

                        {slot.status === 'HELD' && (
                          <div className={styles.heldActionGroup}>
                            <button
                              type="button"
                              onClick={() => handleConfirm(slot.id)}
                              className={styles.btnConfirm}
                            >
                              Xác nhận đặt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRelease(slot.id)}
                              className={styles.btnRelease}
                            >
                              Hủy giữ
                            </button>
                          </div>
                        )}

                        {slot.status === 'BOOKED' && (
                          <button type="button" disabled className={styles.btnDisabled}>
                            Khung giờ đã kín
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
