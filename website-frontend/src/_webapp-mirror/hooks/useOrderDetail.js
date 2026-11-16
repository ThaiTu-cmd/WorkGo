import { useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';

// Items and snapshot of one order (GET /orders/{id}): the package and add-ons
// that were bought and, for DIGITAL, the requirements the client sent.
// status: 'loading' | 'ready' | 'error'
export function useOrderDetail(orderId) {
  const [state, setState] = useState({ status: 'loading', items: [], snapshot: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', items: [], snapshot: null });
    orderApi.getOrder(orderId).then(
      (res) => {
        if (cancelled) return;
        const detail = res?.result;
        const items = [...(detail?.items ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setState({ status: 'ready', items, snapshot: detail?.snapshot ?? null });
      },
      () => {
        if (!cancelled) setState({ status: 'error', items: [], snapshot: null });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return state;
}

export default useOrderDetail;
