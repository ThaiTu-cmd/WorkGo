import { useTranslations } from "next-intl";
import React, { useEffect, useState } from 'react';
import { availabilityApi } from '../../api/availabilityApi';
import { listPublishedServices } from '../../api/catalogListing';
import { Loader2 } from 'lucide-react';
import styles from './BookingSlotsPage.module.css';

/**
 * BookingSlotsPage: Trang xem tình trạng khung giờ của dịch vụ.
 * Chỉ đọc: order-service tự giữ, chốt và nhả slot theo vòng đời đơn hàng.
 */
export default function BookingSlotsPage({
  onNavigate,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
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
          // Not a provider (or no services yet): show published ONSITE services,
          // the only ones that have booking slots.
          const published = await listPublishedServices({
            executionTypes: ['ONSITE']
          }).catch(() => null);
          list = published?.services ?? [];
        }
        if (cancelled) return;
        setServices(list);
        if (list.length > 0) {
          const initialId = list[0].serviceId || list[0].id;
          setSelectedServiceId(initialId);
        }
      } catch (err) {
        if (!cancelled && onShowToast) {
          onShowToast(tr("m303"));
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
  const getRemainingMinutes = holdExpiresAt => {
    if (!holdExpiresAt) return 0;
    const expTime = new Date(holdExpiresAt).getTime();
    const diff = expTime - nowTime;
    return Math.max(0, Math.ceil(diff / (60 * 1000)));
  };
  const navigateTo = page => {
    if (typeof onNavigate === 'function') {
      onNavigate(page);
    }
  };

  // Gom nhóm slots theo ngày
  const slotsByDate = slots.reduce((acc, slot) => {
    const slotDate = slot.startedAt ? new Date(slot.startedAt).toISOString().split('T')[0] : slot.date || tr("m304");
    acc[slotDate] = acc[slotDate] || [];
    acc[slotDate].push(slot);
    return acc;
  }, {});
  const formatTime = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <button type="button" onClick={() => navigateTo('home')} className={styles.breadcrumbLink}>{tr("m242")}</button>
        <span className={styles.breadcrumbSep}>/</span>
        <button type="button" onClick={() => navigateTo('catalog')} className={styles.breadcrumbLink}>{tr("m84")}</button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Khung giờ (Booking Slots)</span>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>{tr("m307")}</h1>
        <p className={styles.subtitle}>{tr("m308")}</p>
      </header>

      {/* Service Selector */}
      <div className={styles.filterCard}>
        <label htmlFor="service-select" className={styles.filterLabel}>{tr("m309")}</label>
        {loadingServices ? <p className={styles.emptyText} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            <Loader2 size={16} style={{
          animation: 'spin 1s linear infinite'
        }} />{tr("m310")}</p> : services.length === 0 ? <p className={styles.emptyText}>{tr("m311")}</p> : <select id="service-select" className={styles.select} value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}>
            {services.map(s => {
          const id = s.serviceId || s.id;
          return <option key={id} value={id}>
                  {s.title} {s.provider?.name ? `— ${s.provider.name}` : ''}
                </option>;
        })}
          </select>}
      </div>

      {/* Slots List */}
      <div className={styles.slotsArea}>
        {loadingSlots ? <div className={styles.emptyCard} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
            <Loader2 size={20} style={{
          animation: 'spin 1s linear infinite'
        }} />
            <p className={styles.emptyText}>{tr("m312")}</p>
          </div> : Object.keys(slotsByDate).length === 0 ? <div className={styles.emptyCard} style={{
        textAlign: 'center',
        padding: '36px 20px'
      }}>
            <div style={{
          fontSize: '2.5rem',
          marginBottom: '8px'
        }}>🕒</div>
            <p className={styles.emptyText} style={{
          fontWeight: 600,
          color: 'var(--wg-text-secondary)',
          fontSize: '1rem',
          margin: '0 0 6px 0'
        }}>{tr("m313")}</p>
            <span style={{
          fontSize: '0.85rem',
          color: 'var(--wg-text-muted)'
        }}>{tr("m314")}</span>
          </div> : Object.entries(slotsByDate).map(([date, dateSlots]) => <div key={date} className={styles.dateGroup}>
              <h2 className={styles.dateHeading}>{tr("m1480")}{date !== tr("m304") ? new Date(date).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : date}
              </h2>
              <div className={styles.slotsGrid}>
                {dateSlots.map(slot => {
            const slotId = slot.bookingSlotId || slot.id;
            const remMinutes = getRemainingMinutes(slot.holdExpiresAt);
            const startTime = slot.startTime || formatTime(slot.startedAt);
            const endTime = slot.endTime || formatTime(slot.endAt);
            return <div key={slotId} className={`
                        ${styles.slotCard}
                        ${slot.status === 'AVAILABLE' ? styles.slotAvailable : ''}
                        ${slot.status === 'HELD' ? styles.slotHeld : ''}
                        ${slot.status === 'BOOKED' ? styles.slotBooked : ''}
                      `}>
                      <div className={styles.slotTime}>
                        ⏰ {startTime} - {endTime}
                      </div>

                      {/* Status Tag */}
                      <div className={styles.slotStatusRow}>
                        {slot.status === 'AVAILABLE' && <span className={styles.badgeAvailable}>{tr("m316")}</span>}
                        {slot.status === 'HELD' && <span className={styles.badgeHeld}>{tr("m1481")}{remMinutes > 0 ? tr("m305", {
                    p0: remMinutes
                  }) : tr("m306")}) (HELD)
                          </span>}
                        {slot.status === 'BOOKED' && <span className={styles.badgeBooked}>{tr("m318")}</span>}
                      </div>
                    </div>;
          })}
              </div>
            </div>)}
      </div>
    </div>;
}