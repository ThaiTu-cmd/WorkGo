import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, MessageSquare, Search, Package } from 'lucide-react';
import { useMyOrders } from '../../hooks/useMyOrders';
import OrderStatusBadge from './components/OrderStatusBadge';
import OrderExecutionInfo from './components/OrderExecutionInfo';
import WorkEvidencePanel from './components/WorkEvidencePanel';
import DigitalDeliveryPanel from './components/DigitalDeliveryPanel';
import OrderBriefPanel from './components/OrderBriefPanel';
import {
  CheckinCode,
  CheckinCodeDialog,
  CheckinDialog,
  DeliveryDialog,
  RequirementsDialog,
  RevisionDialog,
} from './components/OrderFlowDialogs';
import flowStyles from './components/OrderFlow.module.css';
import { useOrderExecution } from '../../hooks/useOrderExecution';
import OrderCancelPage from '../OrderCancel/OrderCancelPage';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
import { orderApi, orderErrorMessage } from '../../api/orderApi';
import { loadCheckinCode, saveCheckinCode } from '../../utils/checkinCodes';
import styles from './OrderDashboardPage.module.css';

const NOTICES = {
  'needs-login': 'Đăng nhập để xem đơn hàng của bạn.',
  error: 'Không kết nối được order-service — chưa tải được đơn hàng.',
  'not-provider': NOT_PROVIDER_MESSAGE,
};

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED'];

const TABS = [
  { id: 'ACTIVE', label: 'Đang xử lý' },
  { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { id: 'DELIVERED', label: 'Đã bàn giao' },
  { id: 'COMPLETED', label: 'Hoàn tất' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

const EXECUTION = {
  DIGITAL: { label: 'Digital', className: 'execDigital' },
  ONSITE: { label: 'Onsite', className: 'execOnsite' },
  DELIVERY: { label: 'Delivery', className: 'execDelivery' },
  APPOINTMENT: { label: 'Appointment', className: 'execAppointment' },
};

// Buttons per role → status → execution type ('ALL' applies to every type).
// `run` names a server call in runAction, `dialog` opens one of the flow dialogs,
// `cancel` opens the cancellation form. order-service refuses to cancel a DELIVERED order.
const ACTIONS = {
  CLIENT: {
    PENDING_PAYMENT: {
      ALL: [
        { id: 'pay', run: 'pay', label: 'Thanh toán', variant: 'primary' },
        { id: 'cancel', label: 'Hủy', variant: 'danger', cancel: true },
      ],
    },
    CONFIRMED: {
      DIGITAL: [{ id: 'requirements', dialog: 'requirements', label: 'Gửi yêu cầu', variant: 'primary' }],
      ALL: [{ id: 'cancel', label: 'Yêu cầu hủy', variant: 'danger', cancel: true }],
    },
    IN_PROGRESS: { ALL: [{ id: 'cancel', label: 'Yêu cầu hủy', variant: 'danger', cancel: true }] },
    DELIVERED: {
      ONSITE: [{ id: 'accept', run: 'acceptOnsite', label: 'Nghiệm thu', variant: 'primary' }],
      DIGITAL: [
        { id: 'accept', run: 'acceptDigital', label: 'Nghiệm thu', variant: 'primary' },
        { id: 'revision', dialog: 'revision', label: 'Yêu cầu sửa', variant: 'outline' },
      ],
    },
  },
  PROVIDER: {
    CONFIRMED: {
      ONSITE: [{ id: 'checkin', dialog: 'checkin', label: 'Check-in', variant: 'primary' }],
      ALL: [{ id: 'cancel', label: 'Từ chối', variant: 'danger', cancel: true }],
    },
    IN_PROGRESS: {
      ONSITE: [{ id: 'complete', run: 'completeOnsite', label: 'Hoàn thành', variant: 'primary' }],
      DIGITAL: [{ id: 'deliver', dialog: 'delivery', label: 'Nộp bài', variant: 'primary' }],
      ALL: [{ id: 'cancel', label: 'Yêu cầu hủy', variant: 'danger', cancel: true }],
    },
  },
};

const actionsFor = (role, order) => {
  const byType = ACTIONS[role][order.orderStatus] || {};
  return [...(byType[order.executionType] || []), ...(byType.ALL || [])];
};

const FLOW_DIALOGS = {
  checkin: CheckinDialog,
  requirements: RequirementsDialog,
  revision: RevisionDialog,
  delivery: DeliveryDialog,
};

const formatPrice = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + ' ₫';

const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '—';

const formatDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(iso))
    : '—';

const timeLeft = (iso) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'sắp tự hoàn tất';
  const hours = Math.ceil(ms / 3600000);
  return hours >= 24 ? `sau ${Math.ceil(hours / 24)} ngày` : `sau ${hours} giờ`;
};

// Milestone column: what the user should know about where the order stands.
function milestone(order, role) {
  switch (order.orderStatus) {
    case 'PENDING_PAYMENT':
      return { text: role === 'CLIENT' ? 'Thanh toán để xác nhận đơn' : 'Chờ khách thanh toán', warn: role === 'CLIENT' };
    case 'CONFIRMED':
      if (order.executionType === 'DIGITAL') {
        return { text: role === 'CLIENT' ? 'Gửi yêu cầu để bắt đầu' : 'Chờ khách gửi yêu cầu', warn: role === 'CLIENT' };
      }
      return {
        text: role === 'CLIENT' ? 'Chờ chuyên gia tới check-in' : 'Check-in khi tới nơi',
        warn: role === 'PROVIDER',
      };
    case 'IN_PROGRESS':
      return { text: `Bắt đầu ${formatDate(order.startedAt)}` };
    case 'DELIVERED':
      return {
        text: order.autoCompleteAt ? `Tự hoàn tất ${timeLeft(order.autoCompleteAt)}` : 'Chờ nghiệm thu',
        warn: true,
      };
    case 'COMPLETED':
      return { text: `Hoàn tất ${formatDate(order.completedAt)}` };
    case 'CANCELLED':
      return { text: `Hủy ${formatDate(order.cancelledAt)}` };
    default:
      return { text: '—' };
  }
}

const paymentLabel = (order) => {
  if (order.orderStatus === 'CANCELLED') return order.paymentStatus === 'SUCCEEDED' ? 'Đã hoàn tiền' : 'Chưa thanh toán';
  if (order.orderStatus === 'COMPLETED') return 'Đã giải ngân';
  return order.paymentStatus === 'SUCCEEDED' ? 'Đã thanh toán · Escrow' : 'Chưa thanh toán';
};

// Client side of a paid ONSITE order: the code the provider needs to check in.
function CheckinCodeCard({ orderId }) {
  const code = loadCheckinCode(orderId);
  return (
    <section className={`${flowStyles.panel} ${flowStyles.codeCard}`} aria-label="Mã check-in">
      <strong className={flowStyles.panelTitle}>Mã check-in</strong>
      {code ? (
        <>
          <CheckinCode code={code} />
          <span className={flowStyles.note}>Đọc mã này cho chuyên gia khi họ tới nơi.</span>
        </>
      ) : (
        <span className={flowStyles.note}>
          Mã chỉ hiển thị một lần khi thanh toán và không được lưu trên trình duyệt này.
        </span>
      )}
    </section>
  );
}

// Server-side progress of an expanded order: execution info for every order,
// plus the flow panel of its type (on-site evidence / digital deliveries).
// The dashboard remounts it (key) after a flow action so everything refetches.
function OrderLiveDetails({ order, role, onShowToast }) {
  const executionState = useOrderExecution(order.orderId);
  return (
    <>
      <OrderExecutionInfo state={executionState} order={order} role={role} onShowToast={onShowToast} />
      <OrderBriefPanel order={order} role={role} />
      {order.executionType === 'ONSITE' && role === 'CLIENT' && order.orderStatus === 'CONFIRMED' && (
        <CheckinCodeCard orderId={order.orderId} />
      )}
      {order.executionType === 'DIGITAL' && <DigitalDeliveryPanel orderId={order.orderId} role={role} />}
      {order.executionType === 'ONSITE' && (
        <WorkEvidencePanel
          orderId={order.orderId}
          role={role}
          orderStatus={order.orderStatus}
          onsiteStatus={executionState.execution?.onsite?.status}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
}

export default function OrderDashboardPage({ onGoHome, onShowToast, onOpenChat }) {
  const [role, setRole] = useState('CLIENT');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('ACTIVE');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  // Open flow dialog { type, order } and the order whose server call is running.
  const [dialog, setDialog] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [paidCode, setPaidCode] = useState(null);
  // Bumped after every flow action so the expanded details refetch.
  const [detailsVersion, setDetailsVersion] = useState(0);
  const { status, isLive, orders, pageInfo, reload } = useMyOrders(role, page);
  const cancelTarget = cancelTargetId ? orders.find((o) => o.orderId === cancelTargetId) : null;

  const toast = (msg) => onShowToast && onShowToast(msg);
  const amountOf = (o) => (role === 'CLIENT' ? o.totalAmount : o.providerNetAmount);

  const counts = useMemo(() => {
    const c = { ACTIVE: 0 };
    orders.forEach((o) => {
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
      completedThisMonth: orders.filter((o) => {
        if (o.orderStatus !== 'COMPLETED' || !o.completedAt) return false;
        const d = new Date(o.completedAt);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length,
      escrow: orders
        .filter((o) => ['CONFIRMED', 'IN_PROGRESS', 'DELIVERED'].includes(o.orderStatus))
        .reduce((sum, o) => sum + (role === 'CLIENT' ? o.totalAmount : o.providerNetAmount), 0),
    };
  }, [orders, counts, role]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const okStatus = tab === 'ACTIVE' ? ACTIVE_STATUSES.includes(o.orderStatus) : o.orderStatus === tab;
      const okQuery =
        !q ||
        o.orderNumber?.toLowerCase().includes(q) ||
        o.title?.toLowerCase().includes(q) ||
        o.counterpartName?.toLowerCase().includes(q);
      return okStatus && okQuery;
    });
  }, [orders, tab, query]);

  const switchRole = (next) => {
    if (next === role) return;
    setRole(next);
    setPage(0);
    setTab('ACTIVE');
    setExpandedId(null);
  };

  const afterFlowAction = (order, message) => {
    toast(`${order.orderNumber}: ${message}`);
    setExpandedId(order.orderId);
    setDetailsVersion((v) => v + 1);
    reload();
  };

  // DEV payment: order-service confirms the order and books the held slot of an
  // ONSITE order; keep its one-time check-in code.
  const pay = async (order) => {
    const res = await orderApi.confirmPayment(order.orderId);
    if (order.executionType !== 'ONSITE') return 'Đã thanh toán, tiền được giữ Escrow';
    const code = res?.checkinCode ?? res?.result?.checkinCode;
    if (code) {
      saveCheckinCode(order.orderId, code);
      setPaidCode(code);
    }
    return 'Đã thanh toán, khung giờ hẹn đã được chốt';
  };

  const SERVER_ACTIONS = {
    pay,
    completeOnsite: async (order) => {
      await orderApi.completeOnsite(order.orderId);
      return 'Đã báo hoàn thành, chờ khách nghiệm thu';
    },
    acceptOnsite: async (order) => {
      await orderApi.acceptOnsite(order.orderId);
      return 'Đã nghiệm thu, Escrow giải ngân cho chuyên gia';
    },
    acceptDigital: async (order) => {
      await orderApi.acceptDigital(order.orderId);
      return 'Đã nghiệm thu bản bàn giao, Escrow giải ngân cho chuyên gia';
    },
  };

  const ACCEPT_ACTIONS = ['acceptOnsite', 'acceptDigital'];

  const runAction = async (order, action) => {
    if (action.cancel) {
      setCancelTargetId(order.orderId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (action.dialog) {
      setDialog({ type: action.dialog, order });
      return;
    }
    if (ACCEPT_ACTIONS.includes(action.run) && !window.confirm('Nghiệm thu đơn này? Tiền Escrow sẽ được giải ngân cho chuyên gia.')) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelSubmit = () => {
    const order = cancelTarget;
    if (!order) return closeCancel();
    setExpandedId(order.orderId);
    setDetailsVersion((v) => v + 1);
    reload();
    closeCancel();
  };

  const partnerHeader = role === 'CLIENT' ? 'Chuyên gia' : 'Khách hàng';

  // The counterpart is the provider when I'm the client, and vice versa.
  const openChat = (o) => {
    const participantId = role === 'CLIENT' ? o.providerId : o.clientId;
    if (!onOpenChat || !participantId) return;
    onOpenChat({
      participantId,
      participantName: o.counterpartName || `${partnerHeader} #${String(participantId).slice(0, 6)}`,
      participantRole: role === 'CLIENT' ? 'PROVIDER' : 'CLIENT',
      context: { type: 'order', id: o.orderId, title: o.title, label: o.orderNumber, status: o.orderStatus },
    });
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {cancelTarget ? (
          <OrderCancelPage order={cancelTarget} role={role} onBack={closeCancel} onSubmit={handleCancelSubmit} onShowToast={toast} />
        ) : (
        <>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
          <button type="button" className={styles.backBtn} onClick={onGoHome}>
            <ArrowLeft size={16} /> Trang chủ
          </button>
          <span className={styles.sep}>/</span>
          <span>Tài khoản</span>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>Đơn hàng</span>
        </nav>

        {/* Header + role toggle */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              <Package size={26} className={styles.titleIcon} aria-hidden="true" /> Quản lý đơn hàng
            </h1>
            <p className={styles.pageSubtitle}>
              Theo dõi tiến độ, bàn giao và nghiệm thu các đơn hàng đang được giữ Escrow.
            </p>
          </div>
          <div className={styles.roleToggle} role="tablist" aria-label="Vai trò">
            {[
              { id: 'CLIENT', label: 'Đơn tôi mua' },
              { id: 'PROVIDER', label: 'Đơn tôi nhận' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={role === r.id}
                className={`${styles.roleBtn} ${role === r.id ? styles.roleBtnActive : ''}`}
                onClick={() => switchRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {!isLive && status !== 'loading' && NOTICES[status] && (
          <div className={styles.notice} role="status">
            <Info size={16} />
            <span>{NOTICES[status]}</span>
          </div>
        )}

        {/* Stats */}
        <section className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Đang xử lý</span>
            <strong className={styles.statValue}>{stats.processing}</strong>
            <span className={styles.statHint}>Đã xác nhận / đang thực hiện</span>
          </div>
          <div className={`${styles.statCard} ${styles.statWarn}`}>
            <span className={styles.statLabel}>Chờ nghiệm thu</span>
            <strong className={styles.statValue}>{stats.delivered}</strong>
            <span className={styles.statHint}>Tự hoàn tất nếu không phản hồi</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Hoàn tất tháng này</span>
            <strong className={styles.statValue}>{stats.completedThisMonth}</strong>
            <span className={styles.statHint}>Trên trang hiện tại</span>
          </div>
          <div className={`${styles.statCard} ${styles.statAccent}`}>
            <span className={styles.statLabel}>{role === 'CLIENT' ? 'Escrow đang giữ' : 'Sắp nhận'}</span>
            <strong className={styles.statValue}>{formatPrice(stats.escrow)}</strong>
            <span className={styles.statHint}>Giải ngân khi nghiệm thu</span>
          </div>
        </section>

        {/* Table */}
        <section className={styles.tableCard}>
          <div className={styles.toolbar}>
            <div className={styles.statusTabs} role="tablist" aria-label="Lọc trạng thái">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label} <span className={styles.tabCount}>{counts[t.id] || 0}</span>
                </button>
              ))}
            </div>
            <label className={styles.search}>
              <Search size={16} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã đơn, dịch vụ, đối tác..."
                aria-label="Tìm đơn hàng"
              />
            </label>
          </div>

          {status === 'loading' ? (
            <div className={styles.emptyRow} role="status">
              <Loader2 size={20} className={styles.spinner} /> Đang tải đơn hàng...
            </div>
          ) : visible.length === 0 ? (
            <div className={styles.emptyRow}>Không có đơn hàng nào phù hợp.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Dịch vụ</th>
                    <th>{partnerHeader}</th>
                    <th className={styles.num}>{role === 'CLIENT' ? 'Tổng tiền' : 'Thực nhận'}</th>
                    <th>Trạng thái</th>
                    <th>Mốc thời gian</th>
                    <th className={styles.actionsHead}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const exec = EXECUTION[o.executionType];
                    const ms = milestone(o, role);
                    // Flow actions need the live order; local demo rows only get cancel.
                    const actions = actionsFor(role, o).filter(
                      (a) => !(a.cancel && o.cancelRequest) && (isLive || a.cancel)
                    );
                    const busy = busyId === o.orderId;
                    const expanded = expandedId === o.orderId;
                    return (
                      <React.Fragment key={o.orderId}>
                        <tr className={expanded ? styles.rowExpanded : ''}>
                          <td data-label="Mã đơn">
                            <span className={styles.orderNo}>{o.orderNumber}</span>
                            <small className={styles.small}>Đặt {formatDate(o.placedAt || o.createdAt)}</small>
                          </td>
                          <td data-label="Dịch vụ">
                            <span className={styles.svcTitle}>{o.title}</span>
                            {exec && <span className={`${styles.exec} ${styles[exec.className]}`}>{exec.label}</span>}
                          </td>
                          <td data-label={partnerHeader}>{o.counterpartName || '—'}</td>
                          <td data-label={role === 'CLIENT' ? 'Tổng tiền' : 'Thực nhận'} className={styles.num}>
                            <strong>{formatPrice(amountOf(o))}</strong>
                          </td>
                          <td data-label="Trạng thái">
                            <OrderStatusBadge status={o.orderStatus} />
                            <span
                              className={`${styles.pay} ${o.paymentStatus !== 'SUCCEEDED' && o.orderStatus !== 'CANCELLED' ? styles.payWarn : ''}`}
                            >
                              {paymentLabel(o)}
                            </span>
                            {o.cancelRequest && <span className={styles.cancelChip}>Đang yêu cầu hủy</span>}
                          </td>
                          <td data-label="Mốc thời gian">
                            <span className={`${styles.due} ${ms.warn ? styles.dueWarn : ''}`}>{ms.text}</span>
                          </td>
                          <td data-label="Thao tác" className={styles.actions}>
                            <div className={styles.actionGroup}>
                            {actions.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                className={`${styles.btn} ${styles[`btn_${a.variant}`]}`}
                                disabled={busy}
                                aria-busy={busy && Boolean(a.run)}
                                onClick={() => runAction(o, a)}
                              >
                                {busy && a.run && <Loader2 size={14} className={styles.spinner} aria-hidden="true" />}
                                {a.label}
                              </button>
                            ))}
                            {onOpenChat && (
                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btn_ghost}`}
                                onClick={() => openChat(o)}
                              >
                                <MessageSquare size={14} aria-hidden="true" />
                                Nhắn tin
                              </button>
                            )}
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btn_ghost}`}
                              aria-expanded={expanded}
                              onClick={() => setExpandedId(expanded ? null : o.orderId)}
                            >
                              Chi tiết
                              <ChevronDown size={14} className={expanded ? styles.chevronOpen : ''} />
                            </button>
                            </div>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className={styles.detailRow}>
                            <td colSpan={7}>
                              <div className={styles.detailGrid}>
                                <dl className={styles.detailList}>
                                  <div>
                                    <dt>Tạm tính</dt>
                                    <dd>{formatPrice(o.subtotal)}</dd>
                                  </div>
                                  <div>
                                    <dt>Phí nền tảng</dt>
                                    <dd>{formatPrice(o.platformFee)}</dd>
                                  </div>
                                  <div>
                                    <dt>Khách thanh toán</dt>
                                    <dd>{formatPrice(o.totalAmount)}</dd>
                                  </div>
                                  <div>
                                    <dt>Chuyên gia nhận</dt>
                                    <dd>{formatPrice(o.providerNetAmount)}</dd>
                                  </div>
                                </dl>
                                <dl className={styles.detailList}>
                                  <div>
                                    <dt>Tạo đơn</dt>
                                    <dd>{formatDateTime(o.createdAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>Xác nhận</dt>
                                    <dd>{formatDateTime(o.confirmedAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>Bắt đầu</dt>
                                    <dd>{formatDateTime(o.startedAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>Bàn giao</dt>
                                    <dd>{formatDateTime(o.deliveredAt)}</dd>
                                  </div>
                                  <div>
                                    <dt>{o.orderStatus === 'CANCELLED' ? 'Hủy' : 'Hoàn tất'}</dt>
                                    <dd>{formatDateTime(o.orderStatus === 'CANCELLED' ? o.cancelledAt : o.completedAt)}</dd>
                                  </div>
                                </dl>
                                {isLive && (
                                  <OrderLiveDetails
                                    key={`${o.orderId}-${o.orderStatus}-${detailsVersion}`}
                                    order={o}
                                    role={role}
                                    onShowToast={toast}
                                  />
                                )}
                                {(o.cancelRequest || o.cancelReason) && (
                                  <div className={styles.cancelInfo}>
                                    <strong>
                                      {o.cancelRequest
                                        ? `Yêu cầu hủy (${formatDateTime(o.cancelRequest.requestedAt)}):`
                                        : `Lý do hủy — ${o.cancelReason.by}:`}
                                    </strong>{' '}
                                    {(o.cancelRequest || o.cancelReason).reasonLabel}
                                    {(o.cancelRequest || o.cancelReason).note && (
                                      <p>“{(o.cancelRequest || o.cancelReason).note}”</p>
                                    )}
                                  </div>
                                )}
                                {o.statusHistory && (
                                  <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                                    <strong style={{ fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '6px' }}>
                                      Lịch sử trạng thái:
                                    </strong>
                                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#64748b' }}>
                                      {o.statusHistory.map((h, hIdx) => (
                                        <li key={hIdx}>
                                          <strong>{h.status}</strong> ({formatDateTime(h.timestamp)}): {h.note}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.pagination}>
            <span>
              Trang {pageInfo.currentPage + 1}/{pageInfo.totalPages} · {pageInfo.totalElements} đơn
            </span>
            <div className={styles.pages}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === 0 || status === 'loading'}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page + 1 >= pageInfo.totalPages || status === 'loading'}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
        </>
        )}

      </div>

      {FlowDialog && (
        <FlowDialog
          order={dialog.order}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null);
            afterFlowAction(dialog.order, message);
          }}
        />
      )}
      {paidCode && <CheckinCodeDialog code={paidCode} onClose={() => setPaidCode(null)} />}
    </div>
  );
}
