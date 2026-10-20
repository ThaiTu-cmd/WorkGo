import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, Search } from 'lucide-react';
import { useMyOrders } from '../../hooks/useMyOrders';
import OrderStatusBadge from './components/OrderStatusBadge';
import OrderCancelPage from '../OrderCancel/OrderCancelPage';
import styles from './OrderDashboardPage.module.css';

const NOTICES = {
  'needs-login': 'Bạn chưa đăng nhập — đang hiển thị đơn hàng mẫu, thao tác chỉ thay đổi trên giao diện.',
  error: 'Không kết nối được order-service — đang hiển thị đơn hàng mẫu.',
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

// Buttons per role and status; each `to` is checked against canTransitionTo in the hook.
// `cancel` actions open the cancellation form instead of transitioning directly.
const ACTIONS = {
  CLIENT: {
    PENDING_PAYMENT: [
      { to: 'CONFIRMED', label: 'Thanh toán', variant: 'primary', toast: 'Đã thanh toán, tiền được giữ Escrow' },
      { to: 'CANCELLED', label: 'Hủy', variant: 'danger', cancel: true },
    ],
    CONFIRMED: [{ to: 'CANCELLED', label: 'Hủy', variant: 'danger', cancel: true }],
    IN_PROGRESS: [{ to: 'CANCELLED', label: 'Yêu cầu hủy', variant: 'danger', cancel: true }],
    DELIVERED: [
      { to: 'COMPLETED', label: 'Nghiệm thu', variant: 'primary', toast: 'Đã nghiệm thu, Escrow giải ngân cho chuyên gia' },
      { to: 'IN_PROGRESS', label: 'Yêu cầu sửa', variant: 'outline', toast: 'Đã gửi yêu cầu chỉnh sửa' },
      { to: 'CANCELLED', label: 'Yêu cầu hủy', variant: 'danger', cancel: true },
    ],
  },
  PROVIDER: {
    CONFIRMED: [
      { to: 'IN_PROGRESS', label: 'Bắt đầu làm', variant: 'primary', toast: 'Đơn đã chuyển sang Đang thực hiện' },
      { to: 'CANCELLED', label: 'Từ chối', variant: 'danger', cancel: true },
    ],
    IN_PROGRESS: [{ to: 'DELIVERED', label: 'Bàn giao', variant: 'primary', toast: 'Đã bàn giao, chờ khách nghiệm thu' }],
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

export default function OrderDashboardPage({ onGoHome, onShowToast }) {
  const [role, setRole] = useState('CLIENT');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('ACTIVE');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const { status, isLive, orders, pageInfo, transition, requestCancel } = useMyOrders(role, page);
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

  const runAction = (order, action) => {
    if (action.cancel) {
      setCancelTargetId(order.orderId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (transition(order.orderId, action.to)) {
      toast(`${order.orderNumber}: ${action.toast}`);
    } else {
      toast('Trạng thái hiện tại không cho phép thao tác này.');
    }
  };

  const closeCancel = () => {
    setCancelTargetId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelSubmit = (reason) => {
    const order = cancelTarget;
    if (!order) return closeCancel();
    const by = role === 'PROVIDER' ? 'Chuyên gia' : 'Khách hàng';
    const { mode, ...detail } = reason;
    if (mode === 'request') {
      if (requestCancel(order.orderId, detail)) {
        toast(`${order.orderNumber}: Đã gửi yêu cầu hủy, chờ phản hồi trong 48 giờ`);
      }
    } else if (transition(order.orderId, 'CANCELLED', { cancelReason: { ...detail, by } })) {
      toast(`${order.orderNumber}: ${role === 'PROVIDER' ? 'Đã từ chối đơn, khách được hoàn tiền' : 'Đã hủy đơn'}`);
      setTab('CANCELLED');
    } else {
      toast('Trạng thái hiện tại không cho phép hủy đơn này.');
    }
    setExpandedId(order.orderId);
    closeCancel();
  };

  const partnerHeader = role === 'CLIENT' ? 'Chuyên gia' : 'Khách hàng';

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
            <h1 className={styles.pageTitle}>Quản lý đơn hàng</h1>
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
                    const actions = (ACTIONS[role][o.orderStatus] || []).filter(
                      (a) => !(a.cancel && o.cancelRequest)
                    );
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
    </div>
  );
}
