import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';

// Root categories from catalog-service (public, no sign-in needed).
// Empty list when the backend is unreachable.
// status: 'loading' | 'api' | 'needs-login' | 'error'
export function useCatalogCategories() {
  const [state, setState] = useState({ categories: [], status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const res = await catalogApi.getRootCategories();
        if (cancelled) return;
        setState({ categories: res?.result?.data ?? [], status: 'api' });
      } catch (err) {
        if (cancelled) return;
        setState({
          categories: [],
          status: err?.status === 401 ? 'needs-login' : 'error',
        });
      }
    };

    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', load);
    };
  }, []);

  return state;
}
