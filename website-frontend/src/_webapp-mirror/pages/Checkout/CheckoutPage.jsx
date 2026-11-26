import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BadgeCheck, Clock, CreditCard, Loader2, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import styles from './CheckoutPage.module.css';
import { orderApi, isOrderable, orderErrorMessage, NOT_ORDERABLE_MESSAGE } from '../../api/orderApi';
import { paymentApi, newIdempotencyKey } from '../../api/paymentApi';
import OnsiteBookingSection, { formatOrderAddress } from './OnsiteBookingSection';
import PaymentOptionPicker from './PaymentOptionPicker';
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

export default function CheckoutPage({
  order,
  onGoBack,
  onShowToast,
  onViewOrders,
  onOpenAddressBook,
  onOpenPayment
}) {
  const tr = useTranslations("misc");
  const walletTr = useTranslations("orderWallet");
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [agreed, setAgreed] = useState(false);
  // ONSITE only: { slot, address } picked in OnsiteBookingSection.
  const [booking, setBooking] = useState({
    slot: null,
    address: null
  });
  const [creating, setCreating] = useState(false);
  const submission = useRef(false);
  const attempt = useRef(null);
  const [feePolicy, setFeePolicy] = useState(null);
  const [snapshotAt] = useState(() => new Date());
  const [rewardQuote,setRewardQuote]=useState(null);
  const [quoteError,setQuoteError]=useState('');
  const [quoteReload,setQuoteReload]=useState(0);
  const quoteRequest=JSON.stringify({serviceId:order?.service?.serviceId,packageId:order?.pkg?.id,addonIds:(order?.addons??[]).map(a=>a.id)});
  useEffect(()=>{
    let active=true;setRewardQuote(null);setQuoteError('');
    const body=JSON.parse(quoteRequest);if(!body.serviceId||!body.packageId)return;
    Promise.resolve().then(()=>orderApi.getRewardQuote(body)).then(res=>{
      const q=res?.result;if(!q?.reference||!Number.isInteger(q.points)||!q.inputHash||!q.expiresAt)throw new Error('Invalid reward quote');
      if(active)setRewardQuote(q);
    }).catch(err=>{if(active)setQuoteError(err.message||'Reward quote unavailable');});
    return()=>{active=false;};
  },[quoteRequest,quoteReload]);
  const hasOrder = Boolean(order);
  useEffect(() => {
    if (!hasOrder) return undefined;
    let active = true;
    paymentApi.getCurrentFeePolicy().then(res => {
      if (active) setFeePolicy(res?.result);
    }).catch(() => {});
    return () => { active = false; };
  }, [hasOrder]);
  if (!order) {
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
  const method = isOnsite ? paymentMethod : 'WALLET';
  const subtotal = Number(pkg.price) + addons.reduce((sum, addon) => sum + Number(addon.price), 0);
  const feeRate = feePolicy?.successFeeRate;
  const fee = feeRate == null ? null : Math.round(subtotal * Number(feeRate));

  const handlePay = async () => {
    if (submission.current || !agreed || !orderable || !bookingReady) return;
    submission.current = true;
    setCreating(true);
    try {
      let body = {
        serviceId: service.serviceId,
        packageId: pkg.id,
        addonIds: addons.map(a => a.id),
        paymentMethod: method,
        ...(isOnsite && {
          bookingSlotId: booking.slot.bookingSlotId,
          address: formatOrderAddress(booking.address)
        })
      };
      const base=JSON.stringify(body);
      if(attempt.current?.base===base){body=JSON.parse(attempt.current.payload);}
      else{
        if(!rewardQuote||Date.parse(rewardQuote.expiresAt)<=Date.now())throw new Error('Quote expired; refresh before confirming');
        body.rewardQuoteRef=rewardQuote.reference;
        attempt.current={base,payload:JSON.stringify(body),key:newIdempotencyKey()};
      }
      const res = await orderApi.createOrder(body, attempt.current.key);
      const created = res?.result;
      if (!created?.orderId) throw new Error();
      attempt.current = null;
      window.dispatchEvent(new Event('workgo-orders-changed'));
      if ((created.paymentMethod || method) === 'CASH') onViewOrders(created.orderId);
      else onOpenPayment({ orderId: created.orderId });
    } catch (err) {
      if (onShowToast) {
        const key = { 2006: 'cashNotAllowed', 2007: 'cashLimit', 2008: 'cashBusy', 2009: 'providerRestricted', 3049: 'creationKeyInvalid', 3050: 'creationKeyConflict' }[Number(err?.code)];
        onShowToast(err?.status === 401 ? tr("m453") : tr("m1451", {
          p0: key ? walletTr(key) : err?.status ? orderErrorMessage(err) : tr("m1303")
        }));
      }
    } finally {
      submission.current = false;
      setCreating(false);
    }
  };
  const steps = [{
    label: tr("m455"),
    state: 'done'
  }, {
    label: tr("m456"),
    state: 'active'
  }, {
    label: tr("m457"),
    state: 'todo'
  }];
  return <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
          <button type="button" className={styles.backBtn} onClick={onGoBack} disabled={creating}>
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

        <>
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

                <PaymentOptionPicker value={method} onChange={setPaymentMethod} isOnsite={isOnsite} disabled={creating} />
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
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  {fee !== null && <div className={styles.priceRow}>
                    <dt>{walletTr("estimatedFee")}</dt>
                    <dd>{formatPrice(fee)}</dd>
                  </div>}
                </dl>

                <div className={styles.totalRow}>
                  <span>{tr("m495")}</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                {method === 'WALLET' && <div className={styles.escrowBox}>
                  <ShieldCheck size={22} />
                  <p>
                    <strong>{tr("m497")}</strong>{tr("m1495")}</p>
                </div>}

                <label className={styles.agree}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>{tr("m499")}</span>
                </label>

                {!orderable && <p className={styles.notOrderable} role="alert">
                    {NOT_ORDERABLE_MESSAGE}
                  </p>}
                {orderable && !bookingReady && <p className={styles.notOrderable}>{tr("m500")}</p>}

                <div role="status">
                  {rewardQuote?<p>Thưởng dự kiến: {rewardQuote.points} điểm · Giá nguồn: {rewardQuote.input?.price} {rewardQuote.input?.currency} · Còn cap cặp: {rewardQuote.remainingPairCap}, Provider: {rewardQuote.remainingProviderCap}. Chỉ ghi thưởng khi đủ điều kiện hoàn tất; model {rewardQuote.modelVersion}.</p>:<p>{quoteError||'Đang lấy quote thưởng từ server…'}</p>}
                  <button type="button" disabled={creating} onClick={()=>setQuoteReload(n=>n+1)}>Làm mới quote</button>
                </div>
                <button type="button" className={styles.btnPay} disabled={!agreed || creating || !orderable || !bookingReady || (!rewardQuote&&!attempt.current)} onClick={handlePay}>{walletTr(method === 'CASH' ? 'bookCash' : 'continueWallet')}
                </button>
                <p className={styles.snapshotTime}>{tr("m1496")}{formatTime(snapshotAt)}{tr("m1497")}</p>
              </aside>
            </div>
          </>
      </div>

      {creating && <div className={styles.overlay} role="status" aria-live="polite">
          <div className={styles.overlayBox}>
            <Loader2 size={36} className={styles.spinner} />
            <p>{tr("m503")}</p>
          </div>
        </div>}
    </div>;
}
