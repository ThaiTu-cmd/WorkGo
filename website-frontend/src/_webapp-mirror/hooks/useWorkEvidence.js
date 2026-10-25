import { useCallback, useEffect, useMemo, useState } from 'react';
import { evidenceApi, EVIDENCE_PHASES } from '../api/evidenceApi';
import { pageItems } from '../api/adapters';

// Work evidence of one ONSITE order. Loads every phase in one call so the
// phase tabs can all show their counts; filtering happens on the client.
// status: 'loading' | 'ready' | 'error'
export function useWorkEvidence(orderId) {
  const [state, setState] = useState({ status: 'loading', items: [], error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));
    evidenceApi.getEvidence(orderId).then(
      (res) => {
        if (!cancelled) setState({ status: 'ready', items: pageItems(res), error: null });
      },
      (err) => {
        if (!cancelled) setState({ status: 'error', items: [], error: err });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [orderId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const counts = useMemo(() => {
    const c = { ALL: state.items.length };
    EVIDENCE_PHASES.forEach((p) => {
      c[p.value] = state.items.filter((e) => e.phase === p.value).length;
    });
    return c;
  }, [state.items]);

  return { ...state, counts, reload };
}

export default useWorkEvidence;
