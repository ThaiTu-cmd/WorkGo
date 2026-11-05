import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, MessageSquare, Search, Package, X } from 'lucide-react';
import { useMyOrders } from '../../hooks/useMyOrders';
import OrderStatusBadge from './components/OrderStatusBadge';
import OrderExecutionInfo from './components/OrderExecutionInfo';
import WorkEvidencePanel from './components/WorkEvidencePanel';
import { useOrderExecution } from '../../hooks/useOrderExecution';
import OrderCancelPage from '../OrderCancel/OrderCancelPage';
import { orderApi } from '../../api/orderApi';
import { NOT_PROVIDER_MESSAGE } from '../../api/axiosClient';
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

// Buttons per role and status; each action can call backend API or open modal/cancellation.
const ACTIONS = {
  CLIENT: {
    PENDING_PAYMENT: [
      { to: 'CONFIRMED', label: 'Thanh toán (Escrow)', variant: 'primary', pay: true, toast: 'Đã thanh toán, tiền được giữ Escrow' },
      { to: 'CANCELLED', label: 'Hủy đơn', variant: 'danger', cancel: true },
    ],
    CONFIRMED: [
      { action: 'SUBMIT_REQUIREMENTS', label: 'Gửi yêu cầu', variant: 'primary', digitalOnly: true },
      { to: 'CANCELLED', label: 'Yêu cầu hủy', variant: 'danger', cancel: true },
    ],
    IN_PROGRESS: [
      { to: 'CANCELLED', label: 'Yêu cầu hủy', variant: 'danger', cancel: true },
    ],
    DELIVERED: [
      { action: 'ACCEPT', label: 'Nghiệm thu hoàn tất', variant: 'primary', toast: 'Đã nghiệm thu, Escrow giải ngân cho chuyên gia' },
      { action: 'REQUEST_REVISION', label: 'Yêu cầu sửa', variant: 'outline', digitalOnly: true, toast: 'Đã gửi yêu cầu chỉnh sửa' },
      { to: 'CANCELLED', label: 'Yêu cầu hủy', variant: 'danger', cancel: true },
    ],
  },
  PROVIDER: {
    CONFIRMED: [
      { action: 'CHECKIN_ONSITE', label: 'Check-in điểm hẹn', variant: 'primary', onsiteOnly: true },
      { to: 'CANCELLED', label: 'Từ chối', variant: 'danger', cancel: true },
    ],
    IN_PROGRESS: [
      { action: 'SUBMIT_DELIVERY', label: 'Bàn giao kết quả', variant: 'primary', digitalOnly: true },
      { action: 'COMPLETE_ONSITE', label: 'Báo xong việc', variant: 'primary', onsiteOnly: true },
      { to: 'CANCELLED', label: 'Yêu cầu hủy', variant: 'danger', cancel: true },
    ],
  },
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
      return { text: role === 'CLIENT' ? 'Chờ chuyên gia bắt đầu' : 'Cần bắt đầu thực hiện', warn: role === 'PROVIDER' };
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

// Server-side progress of an expanded order: execution info for every order,
// plus on-site work evidence for ONSITE orders (both read the same execution).
function OrderLiveDetails({ order, role, onShowToast }) {
  const executionState = useOrderExecution(order.orderId);
  return (
    <>
      <OrderExecutionInfo state={executionState} order={order} role={role} onShowToast={onShowToast} />
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
  const [activeModal, setActiveModal] = useState(null); // { type, order }
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalText, setModalText] = useState('');
  const [modalExtra, setModalExtra] = useState('');

  const { status, isLive, orders, pageInfo, transition, requestCancel, reloadOrders } = useMyOrders(role, page);
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

  const runAction = async (order, action) => {
    if (action.cancel) {
      setCancelTargetId(order.orderId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (action.pay) {
      try {
        await orderApi.confirmPayment(order.orderId);
        toast(`${order.orderNumber}: Đã thanh toán Escrow thành công! Đơn chuyển sang Đã xác nhận.`);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-orders-changed'));
        if (reloadOrders) reloadOrders();
      } catch (err) {
        toast(`Không thể thanh toán: ${err?.message || 'Lỗi kết nối máy chủ'}`);
      }
      return;
    }
    if (action.action === 'ACCEPT') {
      try {
        if (order.executionType === 'ONSITE') {
          await orderApi.acceptOnsite(order.orderId);
        } else {
          await orderApi.acceptDelivery(order.orderId);
        }
        toast(`${order.orderNumber}: Đã nghiệm thu hoàn tất! Escrow giải ngân cho chuyên gia.`);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-orders-changed'));
        if (reloadOrders) reloadOrders();
      } catch (err) {
        toast(`Không thể nghiệm thu: ${err?.message || 'Lỗi kết nối máy chủ'}`);
      }
      return;
    }
    if (action.action === 'COMPLETE_ONSITE') {
      try {
        await orderApi.completeOnsite(order.orderId);
        toast(`${order.orderNumber}: Đã báo xong việc! Chờ khách nghiệm thu tại chỗ.`);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-orders-changed'));
        if (reloadOrders) reloadOrders();
      } catch (err) {
        toast(`Không thể báo xong việc: ${err?.message || 'Lỗi kết nối máy chủ'}`);
      }
      return;
    }
    if (['SUBMIT_REQUIREMENTS', 'SUBMIT_DELIVERY', 'REQUEST_REVISION', 'CHECKIN_ONSITE'].includes(action.action)) {
      setActiveModal({ type: action.action, order });
      setModalText('');
      setModalExtra('');
      setModalError(null);
      return;
    }
    if (transition(order.orderId, action.to)) {
      toast(`${order.orderNumber}: ${action.toast}`);
    } else {
      toast('Trạng thái hiện tại không cho phép thao tác này.');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!activeModal || modalLoading) return;
    const { type, order } = activeModal;
    setModalLoading(true);
    setModalError(null);
    try {
      if (type === 'SUBMIT_REQUIREMENTS') {
        if (!modalText.trim()) throw new Error('Vui lòng nhập mô tả yêu cầu thực hiện');
        const url = modalExtra ? modalExtra.trim() : '';
        if (url && !/^https?:\/\/.+/i.test(url)) {
          throw new Error('Đường dẫn tệp đính kèm phải bắt đầu bằng http:// hoặc https://');
        }
        await orderApi.submitRequirements(order.orderId, {
          note: modalText.trim(),
          values: { note: modalText.trim(), attachmentUrls: url ? [url] : [] },
        });
        toast('Đã gửi yêu cầu thực hiện đơn hàng!');
      } else if (type === 'SUBMIT_DELIVERY') {
        const url = modalExtra ? modalExtra.trim() : '';
        if (url && !/^https?:\/\/.+/i.test(url)) {
          throw new Error('Đường dẫn tệp đính kèm phải bắt đầu bằng http:// hoặc https://');
        }
        await orderApi.submitDelivery(order.orderId, {
          message: modalText.trim() || 'Bàn giao kết quả đơn hàng',
          attachmentUrls: url ? [url] : ['https://workgo.vn/demo-delivery'],
        });
        toast('Đã nộp bài bàn giao kết quả thành công!');
      } else if (type === 'REQUEST_REVISION') {
        if (!modalText.trim()) throw new Error('Vui lòng nhập lý do/yêu cầu chỉnh sửa');
        await orderApi.requestRevision(order.orderId, {
          reason: modalText.trim(),
          note: modalText.trim(),
        });
        toast('Đã gửi yêu cầu chỉnh sửa thành công!');
      } else if (type === 'CHECKIN_ONSITE') {
        if (!modalText.trim()) throw new Error('Vui lòng nhập mã check-in');
        await orderApi.checkinOnsite(order.orderId, { code: modalText.trim() });
        toast('Check-in tại điểm hẹn thành công!');
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('workgo-orders-changed'));
      if (reloadOrders) reloadOrders();
      setActiveModal(null);
    } catch (err) {
      setModalError(err?.message || 'Có lỗi xảy ra khi thực hiện thao tác.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeCancel = () => {
    setCancelTargetId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelSubmit = (reason) => {
    const order = cancelTarget;
    if (!order) return closeCancel();
    if (reloadOrders) reloadOrders();
    setExpandedId(order.orderId);
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
          <OrderCancelPage order={cancelTarget} role={role} onBack={closeCancel} onSubmit={handleCancelSubmit} />
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
            <span className={styles.statHint}>Tự hoàn tất sau 72 giờ</span>
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
                    const actions = (ACTIONS[role][o.orderStatus] || []).filter((a) => {
                      if (a.cancel && (o.cancelRequest || o.orderStatus === 'CANCELLED')) return false;
                      if (a.digitalOnly && o.executionType !== 'DIGITAL') return false;
                      if (a.onsiteOnly && o.executionType !== 'ONSITE') return false;
                      return true;
                    });
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
                                key={a.to}
                                type="button"
                                className={`${styles.btn} ${styles[`btn_${a.variant}`]}`}
                                onClick={() => runAction(o, a)}
                              >
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
                                {isLive && <OrderLiveDetails order={o} role={role} onShowToast={toast} />}
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

        {/* Action Modal for Digital & Onsite flows */}
        {activeModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease-out',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                  {activeModal.type === 'SUBMIT_REQUIREMENTS' && 'Gửi yêu cầu thực hiện đơn hàng'}
                  {activeModal.type === 'SUBMIT_DELIVERY' && 'Bàn giao kết quả đơn hàng'}
                  {activeModal.type === 'REQUEST_REVISION' && 'Yêu cầu chỉnh sửa sản phẩm'}
                  {activeModal.type === 'CHECKIN_ONSITE' && 'Check-in điểm hẹn dịch vụ tận nơi'}
                </h3>
                <button
                  type="button"
                  onClick={() => !modalLoading && setActiveModal(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} style={{ padding: '20px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Đơn hàng: <strong>{activeModal.order?.orderNumber}</strong> ({activeModal.order?.title})
                </p>

                {modalError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      marginBottom: '14px',
                    }}
                    role="alert"
                  >
                    {modalError}
                  </div>
                )}

                {activeModal.type === 'CHECKIN_ONSITE' ? (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                      Mã xác nhận Check-in <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập mã check-in gồm 6 chữ số..."
                      value={modalText}
                      onChange={(e) => setModalText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <small style={{ display: 'block', color: '#64748b', marginTop: '6px', fontSize: '0.78rem' }}>
                      Mã check-in được cấp cho khách hàng sau khi thanh toán đơn hàng.
                    </small>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                        {activeModal.type === 'SUBMIT_REQUIREMENTS' && 'Nội dung chi tiết yêu cầu *'}
                        {activeModal.type === 'SUBMIT_DELIVERY' && 'Ghi chú bàn giao *'}
                        {activeModal.type === 'REQUEST_REVISION' && 'Lý do & Chi tiết cần chỉnh sửa *'}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={modalText}
                        onChange={(e) => setModalText(e.target.value)}
                        placeholder={
                          activeModal.type === 'SUBMIT_REQUIREMENTS'
                            ? 'Mô tả chi tiết mong muốn, phong cách, mục tiêu sản phẩm...'
                            : activeModal.type === 'SUBMIT_DELIVERY'
                            ? 'Mô tả kết quả đã hoàn thành, hướng dẫn xem hoặc sử dụng...'
                            : 'Nêu rõ những điểm chưa đạt yêu cầu cần làm lại...'
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {(activeModal.type === 'SUBMIT_REQUIREMENTS' || activeModal.type === 'SUBMIT_DELIVERY') && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                          Đường dẫn tệp / liên kết đính kèm (URL)
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/... hoặc link lưu trữ"
                          value={modalExtra}
                          onChange={(e) => setModalExtra(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={() => setActiveModal(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {modalLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
