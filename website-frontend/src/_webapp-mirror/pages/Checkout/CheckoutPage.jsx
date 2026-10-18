import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import styles from './CheckoutPage.module.css';

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

// Same shape as order-service PricingSnapshot.
function buildPricingSnapshot(pkg, addons) {
  const subtotal = (pkg.price || 0) + addons.reduce((sum, a) => sum + a.price, 0);
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  return {
    subtotal,
    platformFeeRate: PLATFORM_FEE_RATE,
    platformFee,
    totalAmount: subtotal + platformFee,
    providerNetAmount: subtotal - platformFee,
    currency: 'VND',
  };
}

export default function CheckoutPage({ order, onGoBack, onShowToast, onDone, onViewOrders }) {
  const [gateway, setGateway] = useState('vnpay');
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState('review'); // 'review' | 'redirecting' | 'success'

  // Snapshot is taken once when the page opens; later package edits don't change it.
  const [snapshotAt] = useState(() => new Date());
  const [orderNumber] = useState(() => {
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = `${snapshotAt.getFullYear()}${pad(snapshotAt.getMonth() + 1)}${pad(snapshotAt.getDate())}`;
    return `WG-${ymd}-${String(snapshotAt.getTime()).slice(-4)}`;
  });

  const pricing = useMemo(
    () => (order ? buildPricingSnapshot(order.pkg, order.addons) : null),
    [order]
  );

  useEffect(() => {
    if (phase !== 'redirecting') return undefined;
    const timer = setTimeout(() => setPhase('success'), 1500);
    return () => clearTimeout(timer);
  }, [phase]);

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

  const handlePay = () => {
    if (!agreed || phase !== 'review') return;
    setPhase('redirecting');
    if (onShowToast) onShowToast(`Đang chuyển tới cổng ${currentGateway.name}...`);
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
            <h1 className={styles.pageTitle}>Thanh toán thành công</h1>
            <p>
              Đơn <strong>{orderNumber}</strong> đã được thanh toán {formatPrice(pricing.totalAmount)} qua{' '}
              {currentGateway.name}. Tiền đang được WorkGo giữ <strong>Escrow</strong> và chỉ giải ngân cho chuyên gia
              sau khi bạn nghiệm thu.
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
            <h1 className={styles.pageTitle}>Xác nhận &amp; thanh toán</h1>

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
                        <span className={styles.orderCode}>
                          Mã đơn tạm: <strong>{orderNumber}</strong>
                        </span>
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
                      Phí nền tảng ({Math.round(pricing.platformFeeRate * 100)}%)
                      <span
                        className={styles.tip}
                        tabIndex={0}
                        data-tip="Phí duy trì Escrow, hỗ trợ khiếu nại và bảo vệ giao dịch"
                        aria-label="Phí duy trì Escrow, hỗ trợ khiếu nại và bảo vệ giao dịch"
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

                <button
                  type="button"
                  className={styles.btnPay}
                  disabled={!agreed || phase !== 'review'}
                  onClick={handlePay}
                >
                  Thanh toán {formatPrice(pricing.totalAmount)} qua {currentGateway.name}
                </button>
                <p className={styles.snapshotTime}>
                  Snapshot tạo lúc {formatTime(snapshotAt)} — giá không đổi nếu chuyên gia cập nhật gói.
                </p>
              </aside>
            </div>
          </>
        )}
      </div>

      {phase === 'redirecting' && (
        <div className={styles.overlay} role="status" aria-live="polite">
          <div className={styles.overlayBox}>
            <Loader2 size={36} className={styles.spinner} />
            <p>
              Đang chuyển tới cổng <strong>{currentGateway.name}</strong>…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
