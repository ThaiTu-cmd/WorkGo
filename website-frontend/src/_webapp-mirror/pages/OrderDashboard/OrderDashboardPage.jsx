import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, MessageSquare, Search, Package } from 'lucide-react';
import { useMyOrders } from '../../hooks/useMyOrders';
import OrderStatusBadge from './components/OrderStatusBadge';
import OrderExecutionInfo from './components/OrderExecutionInfo';
import WorkEvidencePanel from './components/WorkEvidencePanel';
import DigitalDeliveryPanel from './components/DigitalDeliveryPanel';
import OrderBriefPanel from './components/OrderBriefPanel';
import { CheckinCode, CheckinDialog, DeliveryDialog, RequirementsDialog, RevisionDialog } from './components/OrderFlowDialogs';
import flowStyles from './components/OrderFlow.module.css';
import { useOrderExecution } from '../../hooks/useOrderExecution';
import OrderCancelPage from '../OrderCancel/OrderCancelPage';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
import { orderApi, orderErrorMessage } from '../../api/orderApi';
import { ORDER_PAYMENT_TIMEOUT_MINUTES } from '../../api/paymentApi';
import styles from './OrderDashboardPage.module.css';
// Labels below are keys of the "misc" dictionary, translated with tr() at render.
const NOTICES = {
  'needs-login': 'm1571',
  error: 'm1572'
};
const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED'];
const TABS = [{
  id: 'ACTIVE',
  label: 'm1573'
}, {
  id: 'PENDING_PAYMENT',
  label: 'm1574'
}, {
  id: 'CONFIRMED',
  label: 'm1575'
}, {
  id: 'IN_PROGRESS',
  label: 'm1576'
}, {
  id: 'DELIVERED',
  label: 'm1577'
}, {
  id: 'COMPLETED',
  label: 'm1578'
}, {
  id: 'CANCELLED',
  label: 'm1579'
}];
const EXECUTION = {
  DIGITAL: {
    label: 'Digital',
    className: 'execDigital'
  },
  ONSITE: {
    label: 'Onsite',
    className: 'execOnsite'
  },
  DELIVERY: {
    label: 'Delivery',
    className: 'execDelivery'
  },
  APPOINTMENT: {
    label: 'Appointment',
    className: 'execAppointment'
  }
};

// Buttons per role → status → execution type ('ALL' applies to every type).
// `run` names a server call in runAction, `dialog` opens one of the flow dialogs,
// `pay` opens the payment page, `cancel` opens the cancellation form.
// order-service refuses to cancel a DELIVERED order.
const ACTIONS = {
  CLIENT: {
    PENDING_PAYMENT: {
      ALL: [{
        id: 'pay',
        pay: true,
        label: 'm1580',
        variant: 'primary'
      }, {
        id: 'cancel',
        label: 'm1581',
        variant: 'danger',
        cancel: true
      }]
    },
    CONFIRMED: {
      DIGITAL: [{
        id: 'requirements',
        dialog: 'requirements',
        label: 'm1582',
        variant: 'primary'
      }],
      ALL: [{
        id: 'cancel',
        label: 'm1583',
        variant: 'danger',
        cancel: true
      }]
    },
    IN_PROGRESS: {
      ALL: [{
        id: 'cancel',
        label: 'm1583',
        variant: 'danger',
        cancel: true
      }]
    },
    DELIVERED: {
      ONSITE: [{
        id: 'accept',
        run: 'acceptOnsite',
        label: 'm1584',
        variant: 'primary'
      }],
      DIGITAL: [{
        id: 'accept',
        run: 'acceptDigital',
        label: 'm1584',
        variant: 'primary'
      }, {
        id: 'revision',
        dialog: 'revision',
        label: 'm1585',
        variant: 'outline'
      }]
    }
  },
  PROVIDER: {
    CONFIRMED: {
      ONSITE: [{
        id: 'checkin',
        dialog: 'checkin',
        label: 'm1621',
        variant: 'primary'
      }],
      ALL: [{
        id: 'cancel',
        label: 'm1586',
        variant: 'danger',
        cancel: true
      }]
    },
    IN_PROGRESS: {
      ONSITE: [{
        id: 'complete',
        run: 'completeOnsite',
        label: 'm1587',
        variant: 'primary'
      }],
      DIGITAL: [{
        id: 'deliver',
        dialog: 'delivery',
        label: 'm1588',
        variant: 'primary'
      }],
      ALL: [{
        id: 'cancel',
        label: 'm1583',
        variant: 'danger',
        cancel: true
      }]
    }
  }
};
const actionsFor = (role, order) => {
  const byType = ACTIONS[role][order.orderStatus] || {};
  return [...(byType[order.executionType] || []), ...(byType.ALL || [])];
};
const FLOW_DIALOGS = {
  checkin: CheckinDialog,
  requirements: RequirementsDialog,
  revision: RevisionDialog,
  delivery: DeliveryDialog
};
const formatPrice = num => new Intl.NumberFormat('vi-VN').format(num || 0) + ' ₫';
const formatDate = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date(iso)) : '—';
const formatDateTime = iso => iso ? new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
}).format(new Date(iso)) : '—';
// Module-level helpers get `tr` from the calling component (useTranslations
// only exists inside components).
const timeLeft = (iso, tr) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return tr("m1589");
  const hours = Math.ceil(ms / 3600000);
  return hours >= 24 ? tr("m821", {
    p0: Math.ceil(hours / 24)
  }) : tr("m1590", {
    p0: hours
  });
};

// Milestone column: what the user should know about where the order stands.
function milestone(order, role, tr) {
  switch (order.orderStatus) {
    case 'PENDING_PAYMENT':
      {
        // order-service cancels unpaid orders ORDER_PAYMENT_TIMEOUT_MINUTES after creation.
        const start = order.createdAt || order.placedAt;
        const deadline = start ? new Date(new Date(start).getTime() + ORDER_PAYMENT_TIMEOUT_MINUTES * 60000).toISOString() : null;
        return {
          text: role === 'CLIENT' ? tr("m1591") : tr("m1592"),
          sub: deadline ? tr("m1739", {
            p0: formatDateTime(deadline)
          }) : null,
          warn: role === 'CLIENT'
        };
      }
    case 'CONFIRMED':
      if (order.executionType === 'DIGITAL') {
        return {
          text: role === 'CLIENT' ? tr("m1593") : tr("m1594"),
          warn: role === 'CLIENT'
        };
      }
      return {
        text: role === 'CLIENT' ? tr("m1595") : tr("m1596"),
        warn: role === 'PROVIDER'
      };
    case 'IN_PROGRESS':
      return {
        text: tr("m827", {
          p0: formatDate(order.startedAt)
        })
      };
    case 'DELIVERED':
      return {
        text: order.autoCompleteAt ? tr("m828", {
          p0: timeLeft(order.autoCompleteAt, tr)
        }) : tr("m1597"),
        warn: true
      };
    case 'COMPLETED':
      return {
        text: tr("m829", {
          p0: formatDate(order.completedAt)
        })
      };
    case 'CANCELLED':
      return {
        text: tr("m830", {
          p0: formatDate(order.cancelledAt)
        })
      };
    default:
      return {
        text: '—'
      };
  }
}
const paymentLabel = (order, tr) => {
  if (order.orderStatus === 'CANCELLED') return order.paymentStatus === 'SUCCEEDED' ? tr("m1598") : tr("m1599");
  if (order.orderStatus === 'COMPLETED') return tr("m1600");
  return order.paymentStatus === 'SUCCEEDED' ? tr("m1601") : tr("m1599");
};

// Client side of a paid ONSITE order: the code the provider needs to check in.
// order-service keeps it (encrypted) while the order is CONFIRMED.
function CheckinCodeCard({
  orderId
}) {
  const tr = useTranslations("misc");
  const [state, setState] = useState({
    status: 'loading',
    code: null,
    error: null
  });
  useEffect(() => {
    let cancelled = false;
    orderApi.getCheckinCode(orderId).then(res => {
      if (!cancelled) setState({
        status: 'ready',
        code: (res?.result ?? res)?.checkinCode ?? null,
        error: null
      });
    }, err => {
      if (!cancelled) setState({
        status: 'error',
        code: null,
        error: err
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);
  return <section className={`${flowStyles.panel} ${flowStyles.codeCard}`} aria-label={tr("m835")}>
      <strong className={flowStyles.panelTitle}>{tr("m835")}</strong>
      {state.status === 'loading' && <Loader2 size={18} className={styles.spinner} aria-label={tr("m1737")} />}
      {state.status === 'ready' && state.code && <>
          <CheckinCode code={state.code} />
          <span className={flowStyles.note}>{tr("m858")}</span>
        </>}
      {state.status === 'error' && <span className={flowStyles.note}>{orderErrorMessage(state.error)}</span>}
    </section>;
}

// Server-side progress of an expanded order: execution info for every order,
// plus the flow panel of its type (on-site evidence / digital deliveries).
// The dashboard remounts it (key) after a flow action so everything refetches.
function OrderLiveDetails({
  order,
  role,
  onShowToast
}) {
  const tr = useTranslations("misc");
  const executionState = useOrderExecution(order.orderId);
  return <>
      <OrderExecutionInfo state={executionState} order={order} role={role} onShowToast={onShowToast} />
      <OrderBriefPanel order={order} role={role} />
      {order.executionType === 'ONSITE' && role === 'CLIENT' && order.orderStatus === 'CONFIRMED' && <CheckinCodeCard orderId={order.orderId} />}
      {order.executionType === 'DIGITAL' && <DigitalDeliveryPanel orderId={order.orderId} role={role} />}
      {order.executionType === 'ONSITE' && <WorkEvidencePanel orderId={order.orderId} role={role} orderStatus={order.orderStatus} onsiteStatus={executionState.execution?.onsite?.status} onShowToast={onShowToast} />}
    </>;
}
export default function OrderDashboardPage({
  onGoHome,
  onShowToast,
  onOpenChat,
  onOpenPayment
}) {
  const tr = useTranslations("misc");
  const [role, setRole] = useState('CLIENT');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('ACTIVE');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  // Open flow dialog { type, order } and the order whose server call is running.
  const [dialog, setDialog] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Bumped after every flow action so the expanded details refetch.
  const [detailsVersion, setDetailsVersion] = useState(0);
  const {
    status,
    isLive,
    orders,
    pageInfo,
    reload
  } = useMyOrders(role, page);
  const cancelTarget = cancelTargetId ? orders.find(o => o.orderId === cancelTargetId) : null;
  const toast = msg => onShowToast && onShowToast(msg);
  const amountOf = o => role === 'CLIENT' ? o.totalAmount : o.providerNetAmount;
  const counts = useMemo(() => {
    const c = {
      ACTIVE: 0
    };
    orders.forEach(o => {
      c[o.orderStatus] = (c[o.orderStatus] || 0) + 1;
      if (ACTIVE_STATUSES.includes(o.orderStatus)) c.ACTIVE += 1;
    });
    return c;
  }, [orders]);
  const stats = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return {
      processing: (counts.CONFIRMED || 0) + (counts.IN_PROGRESS || 0),
      delivered: counts.DELIVERED || 0,
      completedThisMonth: orders.filter(o => {
        if (o.orderStatus !== 'COMPLETED' || !o.completedAt) return false;
        const d = new Date(o.completedAt);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length,
      escrow: orders.filter(o => ['CONFIRMED', 'IN_PROGRESS', 'DELIVERED'].includes(o.orderStatus)).reduce((sum, o) => sum + (role === 'CLIENT' ? o.totalAmount : o.providerNetAmount), 0)
    };
  }, [orders, counts, role]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      const okStatus = tab === 'ACTIVE' ? ACTIVE_STATUSES.includes(o.orderStatus) : o.orderStatus === tab;
      const okQuery = !q || o.orderNumber?.toLowerCase().includes(q) || o.title?.toLowerCase().includes(q) || o.counterpartName?.toLowerCase().includes(q);
      return okStatus && okQuery;
    });
  }, [orders, tab, query]);
  const switchRole = next => {
    if (next === role) return;
    setRole(next);
    setPage(0);
    setTab('ACTIVE');
    setExpandedId(null);
  };
  const afterFlowAction = (order, message) => {
    toast(`${order.orderNumber}: ${message}`);
    setExpandedId(order.orderId);
    setDetailsVersion(v => v + 1);
    reload();
  };

  const SERVER_ACTIONS = {
    completeOnsite: async order => {
      await orderApi.completeOnsite(order.orderId);
      return tr("m838");
    },
    acceptOnsite: async order => {
      await orderApi.acceptOnsite(order.orderId);
      return tr("m839");
    },
    acceptDigital: async order => {
      await orderApi.acceptDigital(order.orderId);
      return tr("m840");
    }
  };
  const ACCEPT_ACTIONS = ['acceptOnsite', 'acceptDigital'];
  const runAction = async (order, action) => {
    if (action.cancel) {
      setCancelTargetId(order.orderId);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    if (action.pay) {
      if (onOpenPayment) onOpenPayment({
        orderId: order.orderId
      });
      return;
    }
    if (action.dialog) {
      setDialog({
        type: action.dialog,
        order
      });
      return;
    }
    if (ACCEPT_ACTIONS.includes(action.run) && !window.confirm(tr("m841"))) {
      return;
    }
    setBusyId(order.orderId);
    try {
      afterFlowAction(order, await SERVER_ACTIONS[action.run](order));
    } catch (err) {
      toast(`${order.orderNumber}: ${orderErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };
  const FlowDialog = dialog && FLOW_DIALOGS[dialog.type];
  const closeCancel = () => {
    setCancelTargetId(null);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleCancelSubmit = () => {
    const order = cancelTarget;
    if (!order) return closeCancel();
    setExpandedId(order.orderId);
    setDetailsVersion(v => v + 1);
    reload();
    closeCancel();
  };
  const partnerHeader = role === 'CLIENT' ? tr("m60") : tr("m625");

  // The counterpart is the provider when I'm the client, and vice versa.
  const openChat = o => {
    const participantId = role === 'CLIENT' ? o.providerId : o.clientId;
    if (!onOpenChat || !participantId) return;
    onOpenChat({
      participantId,
      participantName: o.counterpartName || `${partnerHeader} #${String(participantId).slice(0, 6)}`,
      participantRole: role === 'CLIENT' ? 'PROVIDER' : 'CLIENT',
      context: {
        type: 'order',
        id: o.orderId,
        title: o.title,
        label: o.orderNumber,
        status: o.orderStatus
      }
    });
  };
  return <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {cancelTarget ? <OrderCancelPage order={cancelTarget} role={role} onBack={closeCancel} onSubmit={handleCancelSubmit} onShowToast={toast} /> : <>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
          <button type="button" className={styles.backBtn} onClick={onGoHome}>
            <ArrowLeft size={16} />{tr("m242")}</button>
          <span className={styles.sep}>/</span>
          <span>{tr("m46")}</span>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{tr("m49")}</span>
        </nav>

        {/* Header + role toggle */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <Package size={26} className={styles.titleIcon} aria-hidden="true" />{tr("m860")}</h1>
            <p className={styles.pageSubtitle}>{tr("m861")}</p>
          </div>
          <div className={styles.roleToggle} role="tablist" aria-label={tr("m296")}>
            {[{
              id: 'CLIENT',
              label: tr("m1529")
            }, {
              id: 'PROVIDER',
              label: tr("m1530")
            }].map(r => <button key={r.id} type="button" role="tab" aria-selected={role === r.id} className={`${styles.roleBtn} ${role === r.id ? styles.roleBtnActive : ''}`} onClick={() => switchRole(r.id)}>
                {r.label}
              </button>)}
          </div>
        </div>

        {!isLive && status !== 'loading' && (status === 'not-provider' || NOTICES[status]) && <div className={styles.notice} role="status">
            <Info size={16} />
            <span>{status === 'not-provider' ? NOT_PROVIDER_MESSAGE : tr(NOTICES[status])}</span>
          </div>}

        {/* Stats */}
        <section className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{tr("m815")}</span>
            <strong className={styles.statValue}>{stats.processing}</strong>
            <span className={styles.statHint}>{tr("m862")}</span>
          </div>
          <div className={`${styles.statCard} ${styles.statWarn}`}>
            <span className={styles.statLabel}>{tr("m674")}</span>
            <strong className={styles.statValue}>{stats.delivered}</strong>
            <span className={styles.statHint}>{tr("m863")}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{tr("m864")}</span>
            <strong className={styles.statValue}>{stats.completedThisMonth}</strong>
            <span className={styles.statHint}>{tr("m865")}</span>
          </div>
          <div className={`${styles.statCard} ${styles.statAccent}`}>
            <span className={styles.statLabel}>{role === 'CLIENT' ? tr("m1531") : tr("m1532")}</span>
            <strong className={styles.statValue}>{formatPrice(stats.escrow)}</strong>
            <span className={styles.statHint}>{tr("m867")}</span>
          </div>
        </section>

        {/* Table */}
        <section className={styles.tableCard}>
          <div className={styles.toolbar}>
            <div className={styles.statusTabs} role="tablist" aria-label={tr("m1533")}>
              {TABS.map(t => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
                  {tr(t.label)} <span className={styles.tabCount}>{counts[t.id] || 0}</span>
                </button>)}
            </div>
            <label className={styles.search}>
              <Search size={16} />
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={tr("m1534")} aria-label={tr("m1535")} />
            </label>
          </div>

          {status === 'loading' ? <div className={styles.emptyRow} role="status">
              <Loader2 size={20} className={styles.spinner} />{tr("m868")}</div> : visible.length === 0 ? <div className={styles.emptyRow}>{tr("m869")}</div> : <div className={styles.tableWrap}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>{tr("m870")}</th>
                    <th>{tr("m84")}</th>
                    <th>{partnerHeader}</th>
                    <th className={styles.num}>{role === 'CLIENT' ? tr("m1536") : tr("m1537")}</th>
                    <th>{tr("m259")}</th>
                    <th>{tr("m872")}</th>
                    <th className={styles.actionsHead}>{tr("m551")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(o => {
                  const exec = EXECUTION[o.executionType];
                  const ms = milestone(o, role, tr);
                  // Flow actions need the live order; local demo rows only get cancel.
                  const actions = actionsFor(role, o).filter(a => !(a.cancel && o.cancelRequest) && (isLive || a.cancel));
                  const busy = busyId === o.orderId;
                  const expanded = expandedId === o.orderId;
                  return <React.Fragment key={o.orderId}>
                        <tr className={expanded ? styles.rowExpanded : ''}>
                          <td data-label={tr("m870")}>
                            <span className={styles.orderNo}>{o.orderNumber}</span>
                            <small className={styles.small}>{tr("m1538")}{formatDate(o.placedAt || o.createdAt)}</small>
                          </td>
                          <td data-label={tr("m84")}>
                            <span className={styles.svcTitle}>{o.title}</span>
                            {exec && <span className={`${styles.exec} ${styles[exec.className]}`}>{exec.label}</span>}
                          </td>
                          <td data-label={partnerHeader}>{o.counterpartName || '—'}</td>
                          <td data-label={role === 'CLIENT' ? tr("m1536") : tr("m1537")} className={styles.num}>
                            <strong>{formatPrice(amountOf(o))}</strong>
                          </td>
                          <td data-label={tr("m259")}>
                            <OrderStatusBadge status={o.orderStatus} />
                            <span className={`${styles.pay} ${o.paymentStatus !== 'SUCCEEDED' && o.orderStatus !== 'CANCELLED' ? styles.payWarn : ''}`}>
                              {paymentLabel(o, tr)}
                            </span>
                            {o.cancelRequest && <span className={styles.cancelChip}>{tr("m874")}</span>}
                          </td>
                          <td data-label={tr("m872")}>
                            <span className={`${styles.due} ${ms.warn ? styles.dueWarn : ''}`}>{ms.text}</span>
                            {ms.sub && <span className={styles.dueSub}>{ms.sub}</span>}
                          </td>
                          <td data-label={tr("m551")} className={styles.actions}>
                            <div className={styles.actionGroup}>
                            {actions.map(a => <button key={a.id} type="button" className={`${styles.btn} ${styles[`btn_${a.variant}`]}`} disabled={busy} aria-busy={busy && Boolean(a.run)} onClick={() => runAction(o, a)}>
                                {busy && a.run && <Loader2 size={14} className={styles.spinner} aria-hidden="true" />}
                                {tr(a.label)}
                              </button>)}
                            {onOpenChat && <button type="button" className={`${styles.btn} ${styles.btn_ghost}`} onClick={() => openChat(o)}>
                                <MessageSquare size={14} aria-hidden="true" />{tr("m875")}</button>}
                            <button type="button" className={`${styles.btn} ${styles.btn_ghost}`} aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : o.orderId)}>{tr("m876")}<ChevronDown size={14} className={expanded ? styles.chevronOpen : ''} />
                            </button>
                            </div>
                          </td>
                        </tr>
                        {expanded && <tr className={styles.detailRow}>
                            <td colSpan={7}>
                              <div className={styles.detailGrid}>
                                <dl className={styles.detailList}>
                                  <div>
                                    <dt>{tr("m493")}</dt>
                                    <dd>{formatPrice(o.subtotal)}</dd>
                                  </div>
                                  <div>
                                    <dt>{tr("m716")}</dt>
                                    <dd>{formatPrice(o.platformFee)}</dd>
                                  </div>
                                  <div>
                                    <dt>{tr("m877")}</dt>
                                    <dd>{formatPrice(o.totalAmount)}</dd>
                                  </div>
                                  <div>
                                    <dt>{tr("m878")}</dt>
                                    <dd>{formatPrice(o.providerNetAmount)}</dd>
                                  </div>
                                </dl>
                                <dl className={styles.detailList}>
                                  <div>
                                    <dt>{tr("m879")}</dt>
                                    <dd>{formatDateTime(o.createdAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>{tr("m880")}</dt>
                                    <dd>{formatDateTime(o.confirmedAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>{tr("m194")}</dt>
                                    <dd>{formatDateTime(o.startedAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>{tr("m679")}</dt>
                                    <dd>{formatDateTime(o.deliveredAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>{o.orderStatus === 'CANCELLED' ? tr("m712") : tr("m457")}</dt>
                                    <dd>{formatDateTime(o.orderStatus === 'CANCELLED' ? o.cancelledAt : o.completedAt)}</dd>
                                  </div>
                                </dl>
                                {isLive && <OrderLiveDetails key={`${o.orderId}-${o.orderStatus}-${detailsVersion}`} order={o} role={role} onShowToast={toast} />}
                                {(o.cancelRequest || o.cancelReason) && <div className={styles.cancelInfo}>
                                    <strong>
                                      {o.cancelRequest ? tr("m1456", {
                                p0: formatDateTime(o.cancelRequest.requestedAt)
                              }) : tr("m1457", {
                                p0: o.cancelReason.by
                              })}
                                    </strong>{' '}
                                    {(o.cancelRequest || o.cancelReason).reasonLabel}
                                    {(o.cancelRequest || o.cancelReason).note && <p>“{(o.cancelRequest || o.cancelReason).note}”</p>}
                                  </div>}
                                {o.statusHistory && <div style={{
                            marginTop: '12px',
                            borderTop: '1px dashed var(--wg-border)',
                            paddingTop: '10px'
                          }}>
                                    <strong style={{
                              fontSize: '0.85rem',
                              color: 'var(--wg-text-secondary)',
                              display: 'block',
                              marginBottom: '6px'
                            }}>{tr("m883")}</strong>
                                    <ul style={{
                              margin: 0,
                              paddingLeft: '18px',
                              fontSize: '0.8rem',
                              color: 'var(--wg-text-muted)'
                            }}>
                                      {o.statusHistory.map((h, hIdx) => <li key={hIdx}>
                                          <strong>{h.status}</strong> ({formatDateTime(h.timestamp)}): {h.note}
                                        </li>)}
                                    </ul>
                                  </div>}
                              </div>
                            </td>
                          </tr>}
                      </React.Fragment>;
                })}
                </tbody>
              </table>
            </div>}

          <div className={styles.pagination}>
            <span>
              Trang {pageInfo.currentPage + 1}/{pageInfo.totalPages} · {pageInfo.totalElements}{tr("m1539")}</span>
            <div className={styles.pages}>
              <button type="button" className={styles.pageBtn} disabled={page === 0 || status === 'loading'} onClick={() => setPage(p => p - 1)} aria-label={tr("m425")}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className={styles.pageBtn} disabled={page + 1 >= pageInfo.totalPages || status === 'loading'} onClick={() => setPage(p => p + 1)} aria-label={tr("m1620")}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
        </>}

      </div>

      {FlowDialog && <FlowDialog order={dialog.order} onClose={() => setDialog(null)} onDone={message => {
      setDialog(null);
      afterFlowAction(dialog.order, message);
    }} />}
    </div>;
}