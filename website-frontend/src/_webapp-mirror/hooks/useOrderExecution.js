import { useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';

// Execution progress of one order (GET /orders/{id}/execution).
// status: 'loading' | 'ready' | 'none' | 'error'
export function useOrderExecution(orderId) {
  const [state, setState] = useState({ status: 'loading', execution: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', execution: null });
    orderApi.getExecution(orderId).then(
      (res) => {
        if (!cancelled) setState({ status: 'ready', execution: res?.result ?? null });
      },
      (err) => {
        if (!cancelled) setState({ status: err?.status === 404 ? 'none' : 'error', execution: null });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return state;
}

export default useOrderExecution;
