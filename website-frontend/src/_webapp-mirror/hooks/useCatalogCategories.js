import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { getAccessToken } from '../api/axiosClient';

// Root categories from catalog-service. Empty list when the visitor is not
// signed in (catalog requires a token) or the backend is unreachable.
// status: 'loading' | 'api' | 'needs-login' | 'error'
export function useCatalogCategories() {
  const [state, setState] = useState({ categories: [], status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!getAccessToken()) {
        setState({ categories: [], status: 'needs-login' });
        return;
      }
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
