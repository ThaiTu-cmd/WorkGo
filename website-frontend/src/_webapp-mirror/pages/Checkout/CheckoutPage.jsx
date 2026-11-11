import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, BadgeCheck, Clock, CreditCard, HelpCircle, Loader2, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import styles from './CheckoutPage.module.css';
import { orderApi, isOrderable, orderErrorMessage, NOT_ORDERABLE_MESSAGE } from '../../api/orderApi';
import { DEFAULT_PAYMENT_OPTION, ORDER_PAYMENT_TIMEOUT_MINUTES, paymentErrorMessage, startPayment } from '../../api/paymentApi';
import OnsiteBookingSection, { formatOrderAddress } from './OnsiteBookingSection';
import PaymentOptionPicker from './PaymentOptionPicker';
import { orderLabel } from '../../utils/orderNumber';

// Mirrors order-service `order.platform-fee-rate` (application.yaml).
const PLATFORM_FEE_RATE = 0.1;
// Labels below are keys of the "misc" dictionary (tr() at render).
const EXECUTION_LABELS = {
  DIGITAL: 'm1643',
  ONSITE: 'm1644',
  DELIVERY: 'm1645',
  APPOINTMENT: 'm1626'
};
const TIER_LABELS = {
  BASIC: 'm1646',
  STANDARD: 'm1647',
  PREMIUM: 'm1648'
};
const formatPrice = num => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
const formatTime = date => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
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
    currency: 'VND'
  };
}
export default function CheckoutPage({
  order,
  onGoBack,
  onShowToast,
  onDone,
  onViewOrders,
  onOpenAddressBook,
  onOpenPayment
}) {
  const tr = useTranslations("misc");
  const [gateway, setGateway] = useState(DEFAULT_PAYMENT_OPTION);
  const [agreed, setAgreed] = useState(false);
  // ONSITE only: { slot, address } picked in OnsiteBookingSection.
  const [booking, setBooking] = useState({
    slot: null,
    address: null
  });
  // 'review' → 'creating' (POST /orders) → 'paying' (POST /payments, then leave for
  // the gateway). 'unpaid': the order exists but the payment could not be started.
  const [phase, setPhase] = useState('review');
  // OrderResponse from POST /order/orders.
  const [createdOrder, setCreatedOrder] = useState(null);
  const [payError, setPayError] = useState('');
  const [snapshotAt] = useState(() => new Date());
  const pricing = useMemo(() => {
    if (!order) return null;
    const preview = buildPricingSnapshot(order.pkg, order.addons);
    if (!createdOrder) return preview;
    const num = (v, fallback) => v === null || v === undefined ? fallback : Number(v);
    return {
      ...preview,
      subtotal: num(createdOrder.subtotal, preview.subtotal),
      platformFee: num(createdOrder.platformFee, preview.platformFee),
      totalAmount: num(createdOrder.totalAmount, preview.totalAmount),
      providerNetAmount: num(createdOrder.providerNetAmount, preview.providerNetAmount),
      currency: createdOrder.currency || preview.currency
    };
  }, [order, createdOrder]);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [phase]);
  if (!order || !pricing) {
    return <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.emptyState}>
            <h1 className={styles.pageTitle}>{tr("m463")}</h1>
            <p>{tr("m464")}</p>
            <button type="button" className={styles.backBtn} onClick={onGoBack}>
              <ArrowLeft size={16} />{tr("m465")}</button>
          </div>
        </div>
      </div>;
  }
  const {
    service,
    pkg,
    addons
  } = order;
  const orderable = isOrderable(service.executionType);
  const isOnsite = service.executionType === 'ONSITE';
  const bookingReady = !isOnsite || booking.slot && booking.address;

  // 1) create the order (pricing and slot hold happen server-side),
  // 2) create its payment and leave for the gateway (MOCK: in-app result page).
  const handlePay = async () => {
    if (!agreed || phase !== 'review' || !orderable || !bookingReady) return;
    setPhase('creating');
    let created;
    try {
      const res = await orderApi.createOrder({
        serviceId: service.serviceId,
        packageId: pkg.id,
        addonIds: addons.map(a => a.id),
        ...(isOnsite && {
          bookingSlotId: booking.slot.bookingSlotId,
          address: formatOrderAddress(booking.address)
        })
      });
      created = res?.result ?? null;
      setCreatedOrder(created);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('workgo-orders-changed'));
      }
    } catch (err) {
      setPhase('review');
      if (onShowToast) {
        onShowToast(err?.status === 401 ? tr("m453") : tr("m1451", {
          p0: err?.status ? orderErrorMessage(err) : tr("m1303")
        }));
      }
      return;
    }
    if (!created?.orderId) {
      setPayError(tr("m1303"));
      setPhase('unpaid');
      return;
    }
    setPhase('paying');
    try {
      await startPayment(created.orderId, gateway, {
        onMock: payment => onOpenPayment && onOpenPayment({
          orderId: created.orderId,
          paymentId: payment?.paymentId
        })
      });
    } catch (err) {
      setPayError(err?.status ? paymentErrorMessage(err) : tr("m1303"));
      setPhase('unpaid');
    }
  };
  const steps = [{
    label: tr("m455"),
    state: 'done'
  }, {
    label: tr("m456"),
    state: phase === 'unpaid' ? 'done' : 'active'
  }, {
    label: tr("m457"),
    state: phase === 'unpaid' ? 'active' : 'todo'
  }];
  return <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
          <button type="button" className={styles.backBtn} onClick={onGoBack} disabled={phase !== 'review'}>
            <ArrowLeft size={16} />{tr("m467")}</button>
          <span className={styles.sep}>/</span>
          <span>{tr("m468")}</span>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{tr("m456")}</span>
        </nav>

        {/* Stepper */}
        <ol className={styles.stepper} aria-label={tr("m458")}>
          {steps.map((step, i) => <React.Fragment key={step.label}>
              {i > 0 && <li className={`${styles.stepLine} ${step.state !== 'todo' ? styles.stepLineDone : ''}`} aria-hidden="true" />}
              <li className={`${styles.step} ${styles[`step_${step.state}`]}`} aria-current={step.state === 'active' ? 'step' : undefined}>
                <span className={styles.stepDot}>{step.state === 'done' ? '✓' : i + 1}</span>
                <span className={styles.stepLabel}>{step.label}</span>
              </li>
            </React.Fragment>)}
        </ol>

        {phase === 'unpaid' ? <section className={styles.successCard} aria-live="polite">
            <AlertTriangle size={56} className={styles.warnIcon} />
            <h1 className={styles.pageTitle}>{tr("m1709")}</h1>
            <p>{tr("m1710", {
              p0: (createdOrder && orderLabel(createdOrder)) || '—',
              p1: payError
            })}</p>
            <p className={styles.mutedText}>{tr("m1711", {
              p0: ORDER_PAYMENT_TIMEOUT_MINUTES
            })}</p>
            <div className={styles.successActions}>
              {onOpenPayment && createdOrder?.orderId && <button type="button" className={styles.btnPay} onClick={() => onOpenPayment({
                orderId: createdOrder.orderId
              })}>{tr("m1712")}</button>}
              {onViewOrders && <button type="button" className={styles.btnSecondary} onClick={onViewOrders}>{tr("m475")}</button>}
              <button type="button" className={styles.btnSecondary} onClick={onDone}>{tr("m476")}</button>
            </div>
          </section> : <>
            <h1 className={styles.pageTitle}>
              <CreditCard size={26} className={styles.titleIcon} aria-hidden="true" />{tr("m1490")}</h1>

            <div className={styles.checkoutGrid}>
              {/* ===== Left column ===== */}
              <div className={styles.mainCol}>
                {/* Service snapshot */}
                <section className={styles.card}>
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>{tr("m84")}</h2>
                    <span className={styles.statusBadge}>{tr("m478")}</span>
                  </div>
                  <div className={styles.serviceRow}>
                    {service.coverImage && <img className={styles.serviceThumb} src={service.coverImage} alt="" />}
                    <div className={styles.serviceInfo}>
                      <div className={styles.badgeRow}>
                        <span className={styles.execBadge}>
                          {EXECUTION_LABELS[service.executionType] ? tr(EXECUTION_LABELS[service.executionType]) : service.executionType}
                        </span>
                        <span className={styles.orderCode}>{tr("m479")}</span>
                      </div>
                      <h3 className={styles.serviceTitle}>{service.title}</h3>
                      <p className={styles.provider}>{tr("m480")}<strong>{service.provider?.name}</strong>
                        {service.provider?.isVerified && <BadgeCheck size={15} className={styles.verified} aria-label={tr("m460")} />}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Package snapshot */}
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>{tr("m481")}</h2>
                  <div className={styles.packageBox}>
                    <div className={styles.packageHead}>
                      <div>
                        <span className={styles.tier}>{TIER_LABELS[pkg.tier] ? tr(TIER_LABELS[pkg.tier]) : pkg.tier}</span>
                        <h3 className={styles.packageName}>{pkg.name}</h3>
                      </div>
                      <strong className={styles.packagePrice}>{formatPrice(pkg.price)}</strong>
                    </div>
                    <ul className={styles.packageMeta}>
                      <li>
                        <Clock size={15} /> Giao trong <strong>{pkg.deliveryDays}{tr("m1465")}</strong>
                      </li>
                      <li>
                        <RotateCcw size={15} />{tr("m483")}<strong>{pkg.revisionLimit}</strong>
                      </li>
                      {service.executionType === 'DIGITAL' && <li>
                          <ShieldCheck size={15} />{tr("m484")}<strong>72 giờ</strong>{tr("m485")}</li>}
                    </ul>
                  </div>
                  <h4 className={styles.subTitle}>{tr("m486")}</h4>
                  {addons.length > 0 ? <ul className={styles.addonList}>
                      {addons.map(addon => <li key={addon.id}>
                          <span>{addon.name}</span>
                          <strong>+{formatPrice(addon.price)}</strong>
                        </li>)}
                    </ul> : <p className={styles.mutedText}>{tr("m487")}</p>}
                </section>

                {isOnsite && <OnsiteBookingSection serviceId={service.serviceId} value={booking} onChange={setBooking} onOpenAddressBook={onOpenAddressBook} />}

                {/* Payment gateways */}
                <PaymentOptionPicker value={gateway} onChange={setGateway} disabled={phase !== 'review'} />
              </div>

              {/* ===== Right column: Order Snapshot ===== */}
              <aside className={styles.snapshot} aria-label="Order Snapshot">
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>Order Snapshot</h2>
                  <span className={styles.lockNote}>
                    <Lock size={13} />{tr("m491")}</span>
                </div>

                <dl className={styles.priceList}>
                  <div className={styles.priceRow}>
                    <dt>{tr("m1491")}{TIER_LABELS[pkg.tier] ? tr(TIER_LABELS[pkg.tier]) : pkg.name}</dt>
                    <dd>{formatPrice(pkg.price)}</dd>
                  </div>
                  {addons.map(addon => <div key={addon.id} className={`${styles.priceRow} ${styles.priceRowMuted}`}>
                      <dt>+ {addon.name}</dt>
                      <dd>{formatPrice(addon.price)}</dd>
                    </div>)}
                  <div className={`${styles.priceRow} ${styles.priceRowSubtotal}`}>
                    <dt>{tr("m493")}</dt>
                    <dd>{formatPrice(pricing.subtotal)}</dd>
                  </div>
                  <div className={styles.priceRow}>
                    <dt>{tr("m1492")}{Math.round(pricing.platformFeeRate * 100)}{tr("m1493")}<span className={styles.tip} tabIndex={0} data-tip={tr("m462")} aria-label={tr("m462")}>
                        <HelpCircle size={14} />
                      </span>
                    </dt>
                    <dd>{formatPrice(pricing.platformFee)}</dd>
                  </div>
                </dl>

                <div className={styles.totalRow}>
                  <span>{tr("m495")}</span>
                  <strong>{formatPrice(pricing.totalAmount)}</strong>
                </div>
                <p className={styles.netNote}>{tr("m1494")}{formatPrice(pricing.providerNetAmount)}
                </p>

                <div className={styles.escrowBox}>
                  <ShieldCheck size={22} />
                  <p>
                    <strong>{tr("m497")}</strong>{tr("m1495")}</p>
                </div>

                <label className={styles.agree}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>{tr("m499")}</span>
                </label>

                {!orderable && <p className={styles.notOrderable} role="alert">
                    {NOT_ORDERABLE_MESSAGE}
                  </p>}
                {orderable && !bookingReady && <p className={styles.notOrderable}>{tr("m500")}</p>}

                <button type="button" className={styles.btnPay} disabled={!agreed || phase !== 'review' || !orderable || !bookingReady} onClick={handlePay}>{tr("m468")}{formatPrice(pricing.totalAmount)}
                </button>
                <p className={styles.snapshotTime}>{tr("m1496")}{formatTime(snapshotAt)}{tr("m1497")}</p>
              </aside>
            </div>
          </>}
      </div>

      {(phase === 'creating' || phase === 'paying') && <div className={styles.overlay} role="status" aria-live="polite">
          <div className={styles.overlayBox}>
            <Loader2 size={36} className={styles.spinner} />
            <p>{phase === 'creating' ? tr("m503") : tr("m1708")}</p>
          </div>
        </div>}
    </div>;
}