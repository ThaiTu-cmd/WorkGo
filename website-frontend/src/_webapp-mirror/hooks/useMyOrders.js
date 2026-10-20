import { useCallback, useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';
import { getAccessToken } from '../api/axiosClient';

export const PAGE_SIZE = 10;

// Port of order-service OrderStatus.canTransitionTo.
const TRANSITIONS = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

export const canTransitionTo = (from, to) => (TRANSITIONS[from] || []).includes(to);

// Timestamp each transition stamps on the order (OrderResponse field names).
const STAMP = {
  CONFIRMED: 'confirmedAt',
  IN_PROGRESS: 'startedAt',
  DELIVERED: 'deliveredAt',
  COMPLETED: 'completedAt',
  CANCELLED: 'cancelledAt',
};

const AUTO_COMPLETE_HOURS = 72;

// status: 'loading' | 'api' | 'needs-login' | 'error'
//  - api                 : page of GET /order/orders for this role
//  - needs-login / error : empty list, the page explains why
// Status changes stay local: order-service has no transition endpoint yet (BACKEND_GAPS.md).
const EMPTY_PAGE = { currentPage: 0, totalPages: 1, totalElements: 0 };
export function useMyOrders(roleName, page) {
  const [status, setStatus] = useState('loading');
  const [orders, setOrders] = useState([]);
  const [pageInfo, setPageInfo] = useState({ currentPage: 0, totalPages: 1, totalElements: 0 });

  const fail = useCallback((nextStatus) => {
    setStatus(nextStatus);
    setOrders([]);
    setPageInfo(EMPTY_PAGE);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!getAccessToken()) return fail('needs-login');
      setStatus('loading');
      try {
        const res = await orderApi.getMyOrders(roleName, page, PAGE_SIZE);
        if (cancelled) return;
        const result = res?.result ?? {};
        setOrders(result.data ?? []);
        setPageInfo({
          currentPage: result.currentPage ?? page,
          totalPages: Math.max(1, result.totalPages ?? 1),
          totalElements: result.totalElements ?? 0,
        });
        setStatus('api');
      } catch (err) {
        if (cancelled) return;
        fail(err?.status === 401 ? 'needs-login' : 'error');
      }
    };
    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', load);
    };
  }, [roleName, page, fail]);

  // Returns false when the move breaks canTransitionTo (caller shows a toast).
  // `extra` is merged into the order (e.g. cancelReason from the cancel form).
  const transition = useCallback((orderId, toStatus, extra = {}) => {
    const current = orders.find((o) => o.orderId === orderId);
    if (!current || !canTransitionTo(current.orderStatus, toStatus)) return false;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderId !== orderId || !canTransitionTo(o.orderStatus, toStatus)) return o;
        const nowIso = new Date().toISOString();
        const next = { ...o, ...extra, orderStatus: toStatus, [STAMP[toStatus]]: nowIso, updatedAt: nowIso };
        if (toStatus === 'CONFIRMED') next.paymentStatus = 'SUCCEEDED';
        if (toStatus === 'DELIVERED') {
          next.autoCompleteAt = new Date(Date.now() + AUTO_COMPLETE_HOURS * 3600 * 1000).toISOString();
        }
        if (toStatus === 'IN_PROGRESS') next.autoCompleteAt = null;
        if (toStatus === 'CANCELLED') next.cancelRequest = null;
        return next;
      })
    );
    return true;
  }, [orders]);

  // Client asks to cancel an order already being worked on: the status stays,
  // the order is flagged until the provider / WorkGo decides (local only).
  const requestCancel = useCallback(
    (orderId, reason) => {
      const current = orders.find((o) => o.orderId === orderId);
      if (!current || current.cancelRequest || !canTransitionTo(current.orderStatus, 'CANCELLED')) return false;
      const requestedAt = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, cancelRequest: { ...reason, requestedAt } } : o))
      );
      return true;
    },
    [orders]
  );

  return { status, isLive: status === 'api', orders, pageInfo, transition, requestCancel };
}
