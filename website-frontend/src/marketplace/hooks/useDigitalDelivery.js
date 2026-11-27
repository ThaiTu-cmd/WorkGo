import { useCallback, useEffect, useState } from 'react';
import { orderApi } from '../api/orderApi';

// Delivery versions and revision requests of one DIGITAL order, newest first.
// status: 'loading' | 'ready' | 'error'
export function useDigitalDelivery(orderId) {
  const [state, setState] = useState({ status: 'loading', deliveries: [], revisions: [] });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([orderApi.getDeliveries(orderId), orderApi.getRevisions(orderId)]).then(
      ([deliveries, revisions]) => {
        if (cancelled) return;
        setState({ status: 'ready', deliveries: deliveries?.result ?? [], revisions: revisions?.result ?? [] });
      },
      () => {
        if (!cancelled) setState({ status: 'error', deliveries: [], revisions: [] });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, reload };
}

export default useDigitalDelivery;
