import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import styles from './CheckoutPage.module.css';
import { orderApi, isOrderable, NOT_ORDERABLE_MESSAGE } from '../../api/orderApi';
import { availabilityApi } from '../../api/availabilityApi';
import { addressApi } from '../../api/addressApi';

// Mirrors order-service `order.platform-fee-rate` (application.yaml).
const PLATFORM_FEE_RATE = 0.1;

const GATEWAYS = [
  { id: 'vnpay', name: 'VNPay', desc: 'ATM nội địa, QR ngân hàng', logo: 'VNPAY', logoClass: 'gwVnpay' },
  { id: 'momo', name: 'Ví MoMo', desc: 'Quét mã hoặc mở app MoMo', logo: 'MoMo', logoClass: 'gwMomo' },
  { id: 'zalopay', name: 'ZaloPay', desc: 'Ví ZaloPay, thẻ liên kết', logo: 'ZaloPay', logoClass: 'gwZalopay' },
  { id: 'card', name: 'Thẻ quốc tế', desc: 'Visa, Mastercard, JCB', logo: 'VISA', logoClass: 'gwCard' },
  { id: 'bank', name: 'Chuyển khoản', desc: 'Xác nhận trong 5–15 phút', logo: 'BANK', logoClass: 'gwBank' },
];

const EXECUTION_LABELS = {
  DIGITAL: 'Online / Digital',
  ONSITE: 'Tại nhà / Onsite',
  DELIVERY: 'Giao nhận / Delivery',
  APPOINTMENT: 'Đặt lịch hẹn',
};

const TIER_LABELS = { BASIC: 'Cơ bản', STANDARD: 'Tiêu chuẩn', PREMIUM: 'Cao cấp' };

const formatPrice = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';

const formatTime = (date) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

// Same shape as order-service PricingSnapshot. Used as the preview until the
// order is created; afterwards the server's OrderResponse amounts win.
function buildPricingSnapshot(pkg, addons) {
  const subtotal = (pkg.price || 0) + addons.reduce((sum, a) => sum + a.price, 0);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  return {
    subtotal,
    platformFeeRate: PLATFORM_FEE_RATE,
    platformFee,
    // Same as order-service: the client pays the listed price; the platform
    // fee comes out of the provider's share.
    totalAmount: subtotal,
    providerNetAmount: subtotal - platformFee,
    currency: 'VND',
  };
}

export default function CheckoutPage({ order, onGoBack, onShowToast, onDone, onViewOrders }) {
  const [gateway, setGateway] = useState('vnpay');
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState('review'); // 'review' | 'creating' | 'success'
  // OrderResponse from POST /order/orders.
  const [createdOrder, setCreatedOrder] = useState(null);

  const [snapshotAt] = useState(() => new Date());

  const pricing = useMemo(() => {
    if (!order) return null;
    const preview = buildPricingSnapshot(order.pkg, order.addons);
    if (!createdOrder) return preview;
    const num = (v, fallback) => (v === null || v === undefined ? fallback : Number(v));
    return {
      ...preview,
      subtotal: num(createdOrder.subtotal, preview.subtotal),
      platformFee: num(createdOrder.platformFee, preview.platformFee),
      totalAmount: num(createdOrder.totalAmount, preview.totalAmount),
      providerNetAmount: num(createdOrder.providerNetAmount, preview.providerNetAmount),
      currency: createdOrder.currency || preview.currency,
    };
  }, [order, createdOrder]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  if (!order || !pricing) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.emptyState}>
            <h1 className={styles.pageTitle}>Chưa có đơn hàng để thanh toán</h1>
            <p>Hãy chọn một gói dịch vụ trước khi thanh toán.</p>
            <button type="button" className={styles.backBtn} onClick={onGoBack}>
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { service, pkg, addons } = order;
  const currentGateway = GATEWAYS.find((g) => g.id === gateway) || GATEWAYS[0];

  const isOnsite = service?.executionType === 'ONSITE';
  const [selectedSlotId, setSelectedSlotId] = useState(order?.bookingSlotId || null);
  const [addressInput, setAddressInput] = useState(order?.address || '');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');

  useEffect(() => {
    if (!isOnsite) return;
    let cancelled = false;
    addressApi
      .getMy()
      .then((res) => {
        if (cancelled) return;
        const pageData = res?.result;
        const list = Array.isArray(pageData) ? pageData : (pageData?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          setSavedAddresses(list);
          const def = list.find((a) => a.isDefault) || list[0];
          if (def && !addressInput) {
            setSelectedSavedAddressId(def.addressId || def.id);
            const formatted = [def.street, def.ward, def.district, def.city].filter(Boolean).join(', ');
            setAddressInput(formatted);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnsite]);

  useEffect(() => {
    if (!isOnsite || !service?.serviceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlotError(null);
    availabilityApi
      .getSlots(service.serviceId)
      .then((res) => {
        if (cancelled) return;
        const pageData = res?.result;
        const list = Array.isArray(pageData) ? pageData : (pageData?.data || []);
        setSlots(list);
        if (!selectedSlotId) {
          const firstAvail = list.find((s) => s.status === 'AVAILABLE');
          if (firstAvail) setSelectedSlotId(firstAvail.bookingSlotId || firstAvail.id);
        }
      })
      .catch((err) => {
        if (!cancelled) setSlotError(err?.message || 'Không thể tải lịch rảnh của chuyên gia');
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnsite, service?.serviceId]);

  // Creates the order; payment-service is not routed by the gateway yet,
  // so the order stays PENDING_PAYMENT (see BACKEND_GAPS.md).
  const orderable = isOrderable(service.executionType);
  const canSubmit = agreed && phase === 'review' && orderable && (!isOnsite || (Boolean(selectedSlotId) && Boolean(addressInput.trim())));

  const handlePay = async () => {
    if (!agreed || phase !== 'review' || !orderable) return;
    if (isOnsite) {
      if (!selectedSlotId) {
        if (onShowToast) onShowToast('Vui lòng chọn khung giờ hẹn thực hiện dịch vụ.');
        return;
      }
      if (!addressInput.trim()) {
        if (onShowToast) onShowToast('Vui lòng nhập địa chỉ thực hiện dịch vụ tại nhà.');
        return;
      }
    }
    setPhase('creating');
    try {
      const res = await orderApi.createOrder({
        serviceId: service.serviceId,
        packageId: pkg.id,
        addonIds: addons.map((a) => a.id),
        ...(isOnsite ? {
          bookingSlotId: selectedSlotId,
          address: addressInput.trim(),
        } : {}),
      });
      setCreatedOrder(res?.result ?? null);
      setPhase('success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-orders-changed'));
      }
    } catch (err) {
      setPhase('review');
      if (onShowToast) {
        onShowToast(
          err?.status === 401
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : `Không tạo được đơn hàng: ${err?.message || 'lỗi kết nối máy chủ'}`
        );
      }
    }
  };

  const steps = [
    { label: 'Chọn gói', state: 'done' },
    { label: 'Thanh toán', state: phase === 'success' ? 'done' : 'active' },
    { label: 'Hoàn tất', state: phase === 'success' ? 'active' : 'todo' },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
          <button type="button" className={styles.backBtn} onClick={onGoBack} disabled={phase !== 'review'}>
            <ArrowLeft size={16} /> Quay lại dịch vụ
          </button>
          <span className={styles.sep}>/</span>
          <span>Đặt hàng</span>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Thanh toán</span>
        </nav>

        {/* Stepper */}
        <ol className={styles.stepper} aria-label="Tiến trình đặt hàng">
          {steps.map((step, i) => (
            <React.Fragment key={step.label}>
              {i > 0 && (
                <li
                  className={`${styles.stepLine} ${step.state !== 'todo' ? styles.stepLineDone : ''}`}
                  aria-hidden="true"
                />
              )}
              <li
                className={`${styles.step} ${styles[`step_${step.state}`]}`}
                aria-current={step.state === 'active' ? 'step' : undefined}
              >
                <span className={styles.stepDot}>{step.state === 'done' ? '✓' : i + 1}</span>
                <span className={styles.stepLabel}>{step.label}</span>
              </li>
            </React.Fragment>
          ))}
        </ol>

        {phase === 'success' ? (
          <section className={styles.successCard} aria-live="polite">
            <CheckCircle2 size={56} className={styles.successIcon} />
            <h1 className={styles.pageTitle}>Đặt hàng thành công</h1>
            <p>
              Đơn <strong>{createdOrder?.orderNumber || createdOrder?.orderId}</strong> đã được tạo với tổng{' '}
              {formatPrice(pricing.totalAmount)}. Cổng thanh toán {currentGateway.name} chưa được kết nối nên đơn
              đang ở trạng thái <strong>chờ thanh toán</strong>.
            </p>
            <div className={styles.successActions}>
              {onViewOrders && (
                <button type="button" className={styles.btnPay} onClick={onViewOrders}>
                  Xem đơn hàng
                </button>
              )}
              <button type="button" className={styles.btnSecondary} onClick={onDone}>
                Về trang chủ
              </button>
            </div>
          </section>
        ) : (
          <>
            <h1 className={styles.pageTitle}>
              <CreditCard size={26} className={styles.titleIcon} aria-hidden="true" /> Xác nhận &amp; thanh toán
            </h1>

            <div className={styles.checkoutGrid}>
              {/* ===== Left column ===== */}
              <div className={styles.mainCol}>
                {/* Service snapshot */}
                <section className={styles.card}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>Dịch vụ</h2>
                    <span className={styles.statusBadge}>Chờ thanh toán</span>
                  </div>
                  <div className={styles.serviceRow}>
                    {service.coverImage && <img className={styles.serviceThumb} src={service.coverImage} alt="" />}
                    <div className={styles.serviceInfo}>
                      <div className={styles.badgeRow}>
                        <span className={styles.execBadge}>
                          {EXECUTION_LABELS[service.executionType] || service.executionType}
                        </span>
                        <span className={styles.orderCode}>Mã đơn được cấp khi đặt hàng</span>
                      </div>
                      <h3 className={styles.serviceTitle}>{service.title}</h3>
                      <p className={styles.provider}>
                        Chuyên gia: <strong>{service.provider?.name}</strong>
                        {service.provider?.isVerified && (
                          <BadgeCheck size={15} className={styles.verified} aria-label="Đã xác minh" />
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Package snapshot */}
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>Gói đã chọn</h2>
                  <div className={styles.packageBox}>
                    <div className={styles.packageHead}>
                      <div>
                        <span className={styles.tier}>{TIER_LABELS[pkg.tier] || pkg.tier}</span>
                        <h3 className={styles.packageName}>{pkg.name}</h3>
                      </div>
                      <strong className={styles.packagePrice}>{formatPrice(pkg.price)}</strong>
                    </div>
                    <ul className={styles.packageMeta}>
                      <li>
                        <Clock size={15} /> Giao trong <strong>{pkg.deliveryDays} ngày</strong>
                      </li>
                      <li>
                        <RotateCcw size={15} /> Chỉnh sửa <strong>{pkg.revisionLimit}</strong>
                      </li>
                      {service.executionType === 'DIGITAL' && (
                        <li>
                          <ShieldCheck size={15} /> Tự hoàn tất sau <strong>72 giờ</strong> kể từ khi bàn giao
                        </li>
                      )}
                    </ul>
                  </div>
                  <h4 className={styles.subTitle}>Dịch vụ bổ sung</h4>
                  {addons.length > 0 ? (
                    <ul className={styles.addonList}>
                      {addons.map((addon) => (
                        <li key={addon.id}>
                          <span>{addon.name}</span>
                          <strong>+{formatPrice(addon.price)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.mutedText}>Không chọn dịch vụ bổ sung.</p>
                  )}
                </section>

                {isOnsite && (
                  <>
                    {/* Onsite Booking Slot Picker */}
                    <section className={styles.card}>
                      <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={18} /> Chọn khung giờ hẹn (Booking Slot) <span style={{ color: '#dc2626' }}>*</span>
                        </h2>
                      </div>
                      <p className={styles.cardSub}>
                        Chọn khung giờ chuyên gia sẽ đến địa chỉ của bạn để tiến hành công việc.
                      </p>

                      {loadingSlots ? (
                        <p className={styles.mutedText} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải các khung giờ khả dụng...
                        </p>
                      ) : slotError ? (
                        <p className={styles.notOrderable} role="alert">{slotError}</p>
                      ) : slots.length === 0 ? (
                        <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: '0.88rem' }}>
                          Chuyên gia hiện chưa mở lịch rảnh cho dịch vụ này. Vui lòng liên hệ chuyên gia hoặc chọn dịch vụ khác.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
                          {slots.map((s) => {
                            const slotId = s.bookingSlotId || s.id;
                            const isAvail = s.status === 'AVAILABLE';
                            const isSelected = selectedSlotId === slotId;
                            const dStart = s.startedAt ? new Date(s.startedAt) : null;
                            const dEnd = s.endAt ? new Date(s.endAt) : null;
                            const timeStr = dStart && dEnd
                              ? `${dStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${dEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Khung giờ rảnh';
                            const dateStr = dStart ? dStart.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                            return (
                              <label
                                key={slotId}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                  backgroundColor: !isAvail ? '#f1f5f9' : (isSelected ? '#eff6ff' : '#ffffff'),
                                  cursor: isAvail ? 'pointer' : 'not-allowed',
                                  opacity: isAvail ? 1 : 0.6,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <input
                                    type="radio"
                                    name="bookingSlot"
                                    disabled={!isAvail}
                                    value={slotId}
                                    checked={isSelected}
                                    onChange={() => setSelectedSlotId(slotId)}
                                    style={{ cursor: isAvail ? 'pointer' : 'not-allowed' }}
                                  />
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: isAvail ? '#dcfce7' : '#fecaca', color: isAvail ? '#15803d' : '#b91c1c' }}>
                                    {s.status}
                                  </span>
                                </div>
                                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                                  {timeStr}
                                </strong>
                                <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                                  {dateStr}
                                </small>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* Onsite Address Input */}
                    <section className={styles.card}>
                      <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={18} /> Địa chỉ thực hiện dịch vụ tận nơi <span style={{ color: '#dc2626' }}>*</span>
                        </h2>
                      </div>
                      <p className={styles.cardSub}>
                        Chọn từ sổ địa chỉ của bạn hoặc nhập địa chỉ chính xác nơi chuyên gia sẽ đến làm việc.
                      </p>

                      {savedAddresses.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                            Chọn nhanh từ Sổ địa chỉ đã lưu:
                          </label>
                          <select
                            value={selectedSavedAddressId}
                            onChange={(e) => {
                              const aid = e.target.value;
                              setSelectedSavedAddressId(aid);
                              if (aid) {
                                const found = savedAddresses.find((a) => (a.addressId || a.id) === aid);
                                if (found) {
                                  const parts = [found.street, found.ward, found.district, found.city].filter(Boolean);
                                  setAddressInput(parts.join(', '));
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.88rem',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                            }}
                          >
                            <option value="">-- Chọn địa chỉ có sẵn --</option>
                            {savedAddresses.map((addr) => {
                              const aid = addr.addressId || addr.id;
                              const text = [addr.street, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');
                              return (
                                <option key={aid} value={aid}>
                                  {addr.isDefault ? '⭐ [Mặc định] ' : ''}{text}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      <input
                        type="text"
                        required
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                        value={addressInput}
                        onChange={(e) => {
                          setAddressInput(e.target.value);
                          setSelectedSavedAddressId('');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          marginTop: '6px',
                        }}
                      />
                    </section>
                  </>
                )}

                {/* Payment gateways */}
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>Chọn cổng thanh toán</h2>
                  <p className={styles.cardSub}>
                    Tiền được chuyển vào tài khoản Ký quỹ (Escrow) của WorkGo, chưa tới tay chuyên gia.
                  </p>
                  <div className={styles.gatewayList} role="radiogroup" aria-label="Cổng thanh toán">
                    {GATEWAYS.map((gw) => (
                      <label
                        key={gw.id}
                        className={`${styles.gatewayCard} ${gateway === gw.id ? styles.gatewaySelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="gateway"
                          value={gw.id}
                          checked={gateway === gw.id}
                          onChange={() => setGateway(gw.id)}
                          className={styles.gatewayInput}
                        />
                        <span className={`${styles.gwLogo} ${styles[gw.logoClass]}`} aria-hidden="true">
                          {gw.logo}
                        </span>
                        <span className={styles.gwText}>
                          <strong>{gw.name}</strong>
                          <small>{gw.desc}</small>
                        </span>
                        <span className={styles.gwFee}>Miễn phí</span>
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* ===== Right column: Order Snapshot ===== */}
              <aside className={styles.snapshot} aria-label="Order Snapshot">
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Order Snapshot</h2>
                  <span className={styles.lockNote}>
                    <Lock size={13} /> Giá đã khóa
                  </span>
                </div>

                <dl className={styles.priceList}>
                  <div className={styles.priceRow}>
                    <dt>Giá gói {TIER_LABELS[pkg.tier] || pkg.name}</dt>
                    <dd>{formatPrice(pkg.price)}</dd>
                  </div>
                  {addons.map((addon) => (
                    <div key={addon.id} className={`${styles.priceRow} ${styles.priceRowMuted}`}>
                      <dt>+ {addon.name}</dt>
                      <dd>{formatPrice(addon.price)}</dd>
                    </div>
                  ))}
                  <div className={`${styles.priceRow} ${styles.priceRowSubtotal}`}>
                    <dt>Tạm tính</dt>
                    <dd>{formatPrice(pricing.subtotal)}</dd>
                  </div>
                  <div className={styles.priceRow}>
                    <dt>
                      Phí nền tảng ({Math.round(pricing.platformFeeRate * 100)}%, trừ vào phần chuyên gia)
                      <span
                        className={styles.tip}
                        tabIndex={0}
                        data-tip="Phí duy trì Escrow, hỗ trợ khiếu nại và bảo vệ giao dịch — khách không phải trả thêm"
                        aria-label="Phí duy trì Escrow, hỗ trợ khiếu nại và bảo vệ giao dịch — khách không phải trả thêm"
                      >
                        <HelpCircle size={14} />
                      </span>
                    </dt>
                    <dd>{formatPrice(pricing.platformFee)}</dd>
                  </div>
                </dl>

                <div className={styles.totalRow}>
                  <span>Tổng thanh toán</span>
                  <strong>{formatPrice(pricing.totalAmount)}</strong>
                </div>
                <p className={styles.netNote}>
                  Chuyên gia nhận sau nghiệm thu: {formatPrice(pricing.providerNetAmount)}
                </p>

                <div className={styles.escrowBox}>
                  <ShieldCheck size={22} />
                  <p>
                    <strong>Bảo chứng Escrow</strong> — WorkGo giữ tiền đến khi bạn nghiệm thu. Hoàn tiền 100% nếu
                    chuyên gia không bàn giao.
                  </p>
                </div>

                <label className={styles.agree}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách Escrow của WorkGo.</span>
                </label>

                {!orderable && (
                  <p className={styles.notOrderable} role="alert">
                    {NOT_ORDERABLE_MESSAGE}
                  </p>
                )}

                <button
                  type="button"
                  className={styles.btnPay}
                  disabled={!canSubmit}
                  onClick={handlePay}
                >
                  Đặt hàng {formatPrice(pricing.totalAmount)}
                </button>
                <p className={styles.snapshotTime}>
                  Snapshot tạo lúc {formatTime(snapshotAt)} — giá không đổi nếu chuyên gia cập nhật gói.
                </p>
              </aside>
            </div>
          </>
        )}
      </div>

      {phase === 'creating' && (
        <div className={styles.overlay} role="status" aria-live="polite">
          <div className={styles.overlayBox}>
            <Loader2 size={36} className={styles.spinner} />
            <p>Đang tạo đơn hàng…</p>
          </div>
        </div>
      )}
    </div>
  );
}
