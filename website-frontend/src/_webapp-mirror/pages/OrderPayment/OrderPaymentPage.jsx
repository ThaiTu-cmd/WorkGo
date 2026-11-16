import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, FlaskConical, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import checkoutStyles from '../Checkout/CheckoutPage.module.css';
import styles from './OrderPaymentPage.module.css';
import PaymentOptionPicker from '../Checkout/PaymentOptionPicker';
import OrderStatusBadge from '../OrderDashboard/components/OrderStatusBadge';
import { CheckinCode } from '../OrderDashboard/components/OrderFlowDialogs';
import { orderApi, orderErrorMessage } from '../../api/orderApi';
import { DEFAULT_PAYMENT_OPTION, ORDER_PAYMENT_TIMEOUT_MINUTES, isPaymentWaiting, paymentApi, paymentErrorMessage, startPayment } from '../../api/paymentApi';
import { orderLabel } from '../../utils/orderNumber';

// Gateways only redirect the browser back here; the payment is confirmed by
// their server-to-server IPN, so keep polling a while before giving up.
const POLL_INTERVAL_MS = 3000;
const POLL_LIMIT = 40;
// payment-service tells order-service right after the commit; the check-in code
// becomes readable a moment later.
const CODE_RETRY_MS = 2000;
const CODE_RETRY_LIMIT = 5;
const formatPrice = num => new Intl.NumberFormat('vi-VN').format(Number(num) || 0) + ' ₫';
const formatTime = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date(iso)) : '—';
const paymentDeadline = order => {
  const start = order?.createdAt || order?.placedAt;
  if (!start) return null;
  return new Date(new Date(start).getTime() + ORDER_PAYMENT_TIMEOUT_MINUTES * 60000).toISOString();
};
const unwrap = res => res?.result ?? res ?? null;

// Pay a PENDING_PAYMENT order (orderId only), or follow one payment (paymentId):
// VNPay / MoMo come back here through /payment/result, MOCK payments are settled
// with the simulate buttons.
export default function OrderPaymentPage({
  orderId,
  paymentId,
  gatewayResult,
  onOpenPayment,
  onViewOrders,
  onGoHome,
  onShowToast
}) {
  const tr = useTranslations("misc");
  return paymentId ? <PaymentStatusView key={paymentId} paymentId={paymentId} gatewayResult={gatewayResult} tr={tr} onOpenPayment={onOpenPayment} onViewOrders={onViewOrders} onGoHome={onGoHome} onShowToast={onShowToast} /> : <PayOrderView key={orderId || 'none'} orderId={orderId} tr={tr} onOpenPayment={onOpenPayment} onViewOrders={onViewOrders} onGoHome={onGoHome} />;
}
function PageFrame({
  tr,
  onBack,
  children
}) {
  return <div className={checkoutStyles.pageContainer}>
      <div className={checkoutStyles.contentWrapper}>
        <nav className={checkoutStyles.breadcrumbNav} aria-label="Breadcrumb">
          <button type="button" className={checkoutStyles.backBtn} onClick={onBack}>
            <ArrowLeft size={16} />{tr("m475")}</button>
          <span className={checkoutStyles.sep}>/</span>
          <span className={checkoutStyles.current}>{tr("m1713")}</span>
        </nav>
        {children}
      </div>
    </div>;
}

// ---------- orderId: choose a gateway and start the payment ----------
function PayOrderView({
  orderId,
  tr,
  onOpenPayment,
  onViewOrders,
  onGoHome
}) {
  const [state, setState] = useState({
    status: orderId ? 'loading' : 'error',
    order: null,
    error: null
  });
  const [option, setOption] = useState(DEFAULT_PAYMENT_OPTION);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    orderApi.getOrder(orderId).then(res => {
      if (!cancelled) setState({
        status: 'ready',
        order: unwrap(res)?.order ?? null,
        error: null
      });
    }, err => {
      if (!cancelled) setState({
        status: 'error',
        order: null,
        error: err
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);
  const pay = async () => {
    setPaying(true);
    setPayError('');
    try {
      await startPayment(orderId, option, {
        onMock: payment => onOpenPayment && onOpenPayment({
          orderId,
          paymentId: payment?.paymentId
        })
      });
    } catch (err) {
      setPayError(err?.status ? paymentErrorMessage(err) : tr("m1303"));
      setPaying(false);
    }
  };
  const {
    order
  } = state;
  const back = onViewOrders || onGoHome;
  if (state.status === 'loading') {
    return <PageFrame tr={tr} onBack={back}>
        <div className={checkoutStyles.emptyState} role="status">
          <Loader2 size={32} className={checkoutStyles.spinner} />
        </div>
      </PageFrame>;
  }
  if (state.status === 'error' || !order) {
    return <PageFrame tr={tr} onBack={back}>
        <section className={checkoutStyles.emptyState} role="alert">
          <XCircle size={48} className={checkoutStyles.dangerIcon} />
          <h1 className={checkoutStyles.pageTitle}>{tr("m1713")}</h1>
          <p>{tr("m1720", {
            p0: state.error ? state.error.status ? orderErrorMessage(state.error) : tr("m1303") : '—'
          })}</p>
          <div className={checkoutStyles.successActions}>
            {onViewOrders && <button type="button" className={checkoutStyles.btnSecondary} onClick={onViewOrders}>{tr("m475")}</button>}
          </div>
        </section>
      </PageFrame>;
  }
  if (order.orderStatus !== 'PENDING_PAYMENT') {
    return <PageFrame tr={tr} onBack={back}>
        <section className={checkoutStyles.emptyState}>
          <ShieldCheck size={48} className={checkoutStyles.successIcon} />
          <h1 className={checkoutStyles.pageTitle} title={order.orderNumber}>{orderLabel(order)}</h1>
          <OrderStatusBadge status={order.orderStatus} />
          <p>{tr("m1719")}</p>
          <div className={checkoutStyles.successActions}>
            {onViewOrders && <button type="button" className={checkoutStyles.btnPay} onClick={onViewOrders}>{tr("m475")}</button>}
          </div>
        </section>
      </PageFrame>;
  }
  const deadline = paymentDeadline(order);
  return <PageFrame tr={tr} onBack={back}>
      <h1 className={checkoutStyles.pageTitle}>
        <CreditCard size={26} className={checkoutStyles.titleIcon} aria-hidden="true" />{tr("m1713")}</h1>
      <div className={checkoutStyles.checkoutGrid}>
        <div className={checkoutStyles.mainCol}>
          <PaymentOptionPicker value={option} onChange={setOption} disabled={paying} />
        </div>
        <aside className={checkoutStyles.snapshot} aria-label={tr("m1713")}>
          <dl className={styles.summary}>
            <div>
              <dt>{tr("m1714")}</dt>
              <dd><strong title={order.orderNumber}>{orderLabel(order)}</strong></dd>
            </div>
            {order.title && <div>
                <dt>{tr("m84")}</dt>
                <dd>{order.title}</dd>
              </div>}
            <div>
              <dt>{tr("m1716")}</dt>
              <dd>{formatTime(deadline)}</dd>
            </div>
          </dl>
          <p className={styles.deadlineNote}>{tr("m1717")}</p>
          <div className={checkoutStyles.totalRow}>
            <span>{tr("m1715")}</span>
            <strong>{formatPrice(order.totalAmount)}</strong>
          </div>
          {payError && <p className={checkoutStyles.notOrderable} role="alert">{payError}</p>}
          <button type="button" className={checkoutStyles.btnPay} disabled={paying} onClick={pay}>
            {paying ? tr("m1708") : tr("m1718", {
            p0: formatPrice(order.totalAmount)
          })}
          </button>
        </aside>
      </div>
    </PageFrame>;
}

// ---------- paymentId: follow the payment until it settles ----------
function PaymentStatusView({
  paymentId,
  gatewayResult,
  tr,
  onOpenPayment,
  onViewOrders,
  onGoHome,
  onShowToast
}) {
  const [payment, setPayment] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const pollCount = useRef(0);
  const load = useCallback(async () => {
    try {
      const next = unwrap(await paymentApi.getPayment(paymentId));
      setPayment(next);
      setLoadError(null);
      return next;
    } catch (err) {
      setLoadError(err);
      return null;
    }
  }, [paymentId]);

  // First load, then poll real gateways while the payment is still waiting.
  useEffect(() => {
    let timer = null;
    let stopped = false;
    const tick = async () => {
      const next = await load();
      if (stopped) return;
      const keepWaiting = next && isPaymentWaiting(next) && next.gateway !== 'MOCK';
      if (keepWaiting && pollCount.current < POLL_LIMIT) {
        pollCount.current += 1;
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      } else if (keepWaiting) {
        setTimedOut(true);
      }
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [load]);
  const checkAgain = () => {
    pollCount.current = 0;
    setTimedOut(false);
    load();
  };
  const simulate = async success => {
    if (!payment?.paymentCode) return;
    setSimulating(true);
    try {
      await paymentApi.simulateMockPayment(payment.paymentCode, success);
      await load();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-orders-changed'));
    } catch (err) {
      if (onShowToast) onShowToast(err?.status ? paymentErrorMessage(err) : tr("m1303"));
    } finally {
      setSimulating(false);
    }
  };
  const back = onViewOrders || onGoHome;
  const retry = () => onOpenPayment && payment?.orderId && onOpenPayment({
    orderId: payment.orderId
  });
  if (!payment) {
    return <PageFrame tr={tr} onBack={back}>
        <section className={checkoutStyles.emptyState} role={loadError ? 'alert' : 'status'}>
          {loadError ? <>
              <XCircle size={48} className={checkoutStyles.dangerIcon} />
              <p>{tr("m1736", {
              p0: loadError.status ? paymentErrorMessage(loadError) : tr("m1303")
            })}</p>
              <div className={checkoutStyles.successActions}>
                <button type="button" className={checkoutStyles.btnSecondary} onClick={checkAgain}>{tr("m1734")}</button>
                {onViewOrders && <button type="button" className={checkoutStyles.btnSecondary} onClick={onViewOrders}>{tr("m475")}</button>}
              </div>
            </> : <Loader2 size={32} className={checkoutStyles.spinner} />}
        </section>
      </PageFrame>;
  }
  if (payment.status === 'SUCCEEDED') {
    return <PageFrame tr={tr} onBack={back}>
        <section className={checkoutStyles.successCard} aria-live="polite">
          <CheckCircle2 size={56} className={checkoutStyles.successIcon} />
          <h1 className={checkoutStyles.pageTitle}>{tr("m1721")}</h1>
          <p>{tr("m1722", {
            p0: formatPrice(payment.amount)
          })}</p>
          <p className={checkoutStyles.mutedText}>{payment.paymentCode} · {formatTime(payment.paidAt)}</p>
          <PaidOrderInfo orderId={payment.orderId} tr={tr} />
          <div className={checkoutStyles.successActions}>
            {onViewOrders && <button type="button" className={checkoutStyles.btnPay} onClick={onViewOrders}>{tr("m475")}</button>}
            {onGoHome && <button type="button" className={checkoutStyles.btnSecondary} onClick={onGoHome}>{tr("m476")}</button>}
          </div>
        </section>
      </PageFrame>;
  }
  if (!isPaymentWaiting(payment)) {
    const failed = payment.status === 'FAILED';
    return <PageFrame tr={tr} onBack={back}>
        <section className={checkoutStyles.successCard} role="alert">
          <XCircle size={56} className={checkoutStyles.dangerIcon} />
          <h1 className={checkoutStyles.pageTitle}>{tr("m1723")}</h1>
          <p>{failed ? tr("m1724", {
            p0: payment.paymentCode
          }) : tr("m1731")}</p>
          {payment.failureMessage && <p className={checkoutStyles.mutedText}>{payment.failureMessage}</p>}
          <div className={checkoutStyles.successActions}>
            {onOpenPayment && <button type="button" className={checkoutStyles.btnPay} onClick={retry}>{tr("m1735")}</button>}
            {onViewOrders && <button type="button" className={checkoutStyles.btnSecondary} onClick={onViewOrders}>{tr("m475")}</button>}
          </div>
        </section>
      </PageFrame>;
  }

  // Still waiting.
  const isMock = payment.gateway === 'MOCK';
  return <PageFrame tr={tr} onBack={back}>
      <section className={checkoutStyles.successCard} aria-live="polite">
        {isMock ? <FlaskConical size={52} className={checkoutStyles.warnIcon} /> : timedOut ? <AlertTriangle size={52} className={checkoutStyles.warnIcon} /> : <Loader2 size={52} className={checkoutStyles.spinner} />}
        <h1 className={checkoutStyles.pageTitle}>{isMock ? tr("m1727") : tr("m1725")}</h1>
        {gatewayResult === 'invalid' && <p className={checkoutStyles.notOrderable}>{tr("m1732")}</p>}
        <p>{isMock ? tr("m1728") : timedOut ? tr("m1733") : tr("m1726")}</p>
        <dl className={styles.summary}>
          <div>
            <dt>{tr("m1715")}</dt>
            <dd><strong>{formatPrice(payment.amount)}</strong></dd>
          </div>
          <div>
            <dt>{tr("m1738")}</dt>
            <dd>{formatTime(payment.expiresAt)}</dd>
          </div>
        </dl>
        <div className={checkoutStyles.successActions}>
          {isMock ? <>
              <button type="button" className={checkoutStyles.btnPay} disabled={simulating} onClick={() => simulate(true)}>{tr("m1729")}</button>
              <button type="button" className={checkoutStyles.btnSecondary} disabled={simulating} onClick={() => simulate(false)}>{tr("m1730")}</button>
            </> : <>
              {timedOut && <button type="button" className={checkoutStyles.btnPay} onClick={checkAgain}>{tr("m1734")}</button>}
              {!timedOut && payment.paymentUrl && <a className={`${checkoutStyles.btnSecondary} ${styles.linkBtn}`} href={payment.paymentUrl}>{tr("m1712")}</a>}
              {onViewOrders && <button type="button" className={checkoutStyles.btnSecondary} onClick={onViewOrders}>{tr("m475")}</button>}
            </>}
        </div>
      </section>
    </PageFrame>;
}

// After a successful payment of an ONSITE order: the check-in code the client
// reads to the provider (order-service keeps it; it can be fetched again later).
function PaidOrderInfo({
  orderId,
  tr
}) {
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState(null);
  const [codeState, setCodeState] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'missing'

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    let timer = null;
    let attempt = 0;
    const fetchCode = () => {
      orderApi.getCheckinCode(orderId).then(res => {
        if (cancelled) return;
        setCode(unwrap(res)?.checkinCode ?? null);
        setCodeState('ready');
      }, () => {
        if (cancelled) return;
        attempt += 1;
        if (attempt < CODE_RETRY_LIMIT) timer = setTimeout(fetchCode, CODE_RETRY_MS);else setCodeState('missing');
      });
    };
    orderApi.getOrder(orderId).then(res => {
      if (cancelled) return;
      const next = unwrap(res)?.order ?? null;
      setOrder(next);
      if (next?.executionType === 'ONSITE') {
        setCodeState('loading');
        fetchCode();
      }
    }, () => {});
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);
  if (!order) return null;
  return <div className={styles.paidInfo}>
      <span className={checkoutStyles.mutedText} title={order.orderNumber}>{orderLabel(order)}</span>
      <OrderStatusBadge status={order.orderStatus} />
      {order.executionType === 'ONSITE' && <div className={styles.codeBox}>
          <strong>{tr("m835")}</strong>
          {codeState === 'ready' && code ? <>
              <CheckinCode code={code} />
              <span className={checkoutStyles.mutedText}>{tr("m858")}</span>
            </> : <span className={checkoutStyles.mutedText}>{codeState === 'missing' ? orderErrorMessage({
            code: 3020
          }) : tr("m1737")}</span>}
        </div>}
    </div>;
}
