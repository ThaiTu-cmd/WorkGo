import React, { useEffect, useState } from 'react';
import { availabilityApi } from '../../api/availabilityApi';
import { catalogApi } from '../../api/catalogApi';
import { Loader2 } from 'lucide-react';
import styles from './BookingSlotsPage.module.css';

/**
 * BookingSlotsPage: Trang Đặt lịch hẹn và Quản lý Slot giờ của Chuyên gia.
 * Kết nối 100% backend API: availabilityApi (GET slots, POST hold, confirm, release).
 */
export default function BookingSlotsPage({ onNavigate, onShowToast }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [nowTime, setNowTime] = useState(Date.now());

  // 1. Tải danh sách dịch vụ từ backend
  useEffect(() => {
    let cancelled = false;
    setLoadingServices(true);

    const loadServices = async () => {
      try {
        let list = [];
        try {
          const myRes = await availabilityApi.getMyServices();
          const data = myRes?.result?.data || (Array.isArray(myRes?.result) ? myRes.result : []);
          if (Array.isArray(data) && data.length > 0) {
            list = data;
          }
        } catch {
          // Fallback to public services if not provider
        }

        if (list.length === 0) {
          const catRes = await catalogApi.listServices({ page: 0, size: 20 }).catch(() => null);
          const data = catRes?.result?.data || (Array.isArray(catRes?.result) ? catRes.result : []);
          if (Array.isArray(data)) list = data;
        }

        if (cancelled) return;
        setServices(list);
        if (list.length > 0) {
          const initialId = list[0].serviceId || list[0].id;
          setSelectedServiceId(initialId);
        }
      } catch (err) {
        if (!cancelled && onShowToast) {
          onShowToast('Không thể tải danh sách dịch vụ từ hệ thống.');
        }
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    };

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Tải danh sách slots theo dịch vụ
  const loadSlots = async (serviceId = selectedServiceId) => {
    if (!serviceId) return;
    setNowTime(Date.now());
    setLoadingSlots(true);
    try {
      const res = await availabilityApi.getSlots(serviceId);
      const data = res?.result?.data || (Array.isArray(res?.result) ? res.result : []);
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      loadSlots(selectedServiceId);
    }

    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 30000);

    const handleSync = () => {
      loadSlots(selectedServiceId);
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

  const DUMMY_ORDER_ID = '00000000-0000-0000-0000-000000000000';

  const handleHold = async (slotId) => {
    setActionLoadingId(slotId);
    try {
      await availabilityApi.holdSlot(slotId, DUMMY_ORDER_ID);
      await loadSlots();
      if (onShowToast) {
        onShowToast('Đã giữ chỗ trong 30 phút. Vui lòng xác nhận trước khi hết hạn!');
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-slots-changed'));
    } catch (err) {
      if (onShowToast) onShowToast(`Không thể giữ slot: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirm = async (slotId) => {
    setActionLoadingId(slotId);
    try {
      await availabilityApi.confirmSlot(slotId, DUMMY_ORDER_ID);
      await loadSlots();
      if (onShowToast) {
        onShowToast('Xác nhận đặt lịch thành công! Chuyên gia đã nhận được thông báo.');
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-slots-changed'));
    } catch (err) {
      if (onShowToast) onShowToast(`Không thể xác nhận slot: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRelease = async (slotId) => {
    setActionLoadingId(slotId);
    try {
      await availabilityApi.releaseSlot(slotId, DUMMY_ORDER_ID);
      await loadSlots();
      if (onShowToast) {
        onShowToast('Đã hủy giữ chỗ. Khung giờ hiện đã sẵn sàng cho người khác.');
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-slots-changed'));
    } catch (err) {
      if (onShowToast) onShowToast(`Không thể nhả slot: ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRemainingMinutes = (holdExpiresAt) => {
    if (!holdExpiresAt) return 0;
    const expTime = new Date(holdExpiresAt).getTime();
    const diff = expTime - nowTime;
    return Math.max(0, Math.ceil(diff / (60 * 1000)));
  };

  const navigateTo = (page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // Gom nhóm slots theo ngày
  const slotsByDate = slots.reduce((acc, slot) => {
    const slotDate = slot.startedAt
      ? new Date(slot.startedAt).toISOString().split('T')[0]
      : (slot.date || 'Lịch hẹn chung');
    acc[slotDate] = acc[slotDate] || [];
    acc[slotDate].push(slot);
    return acc;
  }, {});

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

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
        <h1 className={styles.title}>Quản lý &amp; Đặt lịch hẹn chuyên gia</h1>
        <p className={styles.subtitle}>
          Đặt trước khung giờ tư vấn trực tuyến 1-1 với chuyên gia. Khung giờ được giữ tối đa 30 phút trong khi bạn hoàn tất thanh toán.
        </p>
      </header>

      {/* Service Selector */}
      <div className={styles.filterCard}>
        <label htmlFor="service-select" className={styles.filterLabel}>
          Chọn dịch vụ chuyên gia:
        </label>
        {loadingServices ? (
          <p className={styles.emptyText} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải danh sách dịch vụ...
          </p>
        ) : services.length === 0 ? (
          <p className={styles.emptyText}>Chưa có dịch vụ nào trên hệ thống.</p>
        ) : (
          <select
            id="service-select"
            className={styles.select}
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
          >
            {services.map((s) => {
              const id = s.serviceId || s.id;
              return (
                <option key={id} value={id}>
                  {s.title} {s.provider?.name ? `— ${s.provider.name}` : ''}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Slots List */}
      <div className={styles.slotsArea}>
        {loadingSlots ? (
          <div className={styles.emptyCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <p className={styles.emptyText}>Đang tải danh sách khung giờ từ máy chủ...</p>
          </div>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <div className={styles.emptyCard} style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🕒</div>
            <p className={styles.emptyText} style={{ fontWeight: 600, color: '#334155', fontSize: '1rem', margin: '0 0 6px 0' }}>
              Chuyên gia chưa thiết lập slot khả dụng cho dịch vụ này
            </p>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Vui lòng chọn dịch vụ tận nơi khác hoặc liên hệ trực tiếp với chuyên gia để mở thêm ca làm việc.
            </span>
          </div>
        ) : (
          Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date} className={styles.dateGroup}>
              <h2 className={styles.dateHeading}>
                📅 Ngày: {date !== 'Lịch hẹn chung' ? new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : date}
              </h2>
              <div className={styles.slotsGrid}>
                {dateSlots.map((slot) => {
                  const slotId = slot.bookingSlotId || slot.id;
                  const remMinutes = getRemainingMinutes(slot.holdExpiresAt);
                  const isActing = actionLoadingId === slotId;
                  const startTime = slot.startTime || formatTime(slot.startedAt);
                  const endTime = slot.endTime || formatTime(slot.endAt);

                  return (
                    <div
                      key={slotId}
                      className={`
                        ${styles.slotCard}
                        ${slot.status === 'AVAILABLE' ? styles.slotAvailable : ''}
                        ${slot.status === 'HELD' ? styles.slotHeld : ''}
                        ${slot.status === 'BOOKED' ? styles.slotBooked : ''}
                      `}
                    >
                      <div className={styles.slotTime}>
                        ⏰ {startTime} - {endTime}
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
                            disabled={isActing}
                            onClick={() => handleHold(slotId)}
                            className={styles.btnPrimary}
                          >
                            {isActing ? 'Đang giữ...' : 'Giữ chỗ 30 phút'}
                          </button>
                        )}

                        {slot.status === 'HELD' && (
                          <div className={styles.heldActionGroup}>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleConfirm(slotId)}
                              className={styles.btnConfirm}
                            >
                              {isActing ? '...' : 'Xác nhận đặt'}
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleRelease(slotId)}
                              className={styles.btnRelease}
                            >
                              {isActing ? '...' : 'Hủy giữ'}
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
