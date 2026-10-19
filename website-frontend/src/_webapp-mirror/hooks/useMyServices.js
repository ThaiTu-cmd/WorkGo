import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { getAccessToken } from '../api/axiosClient';
import { pageItems, toMyServiceRow } from '../api/adapters';

// The signed-in provider's services (GET /catalog/services/my-services),
// each joined with its packages (price range) and category name.
// status: 'loading' | 'ready' | 'needs-login' | 'forbidden' | 'error'
export function useMyServices() {
  const [state, setState] = useState({ status: 'loading', services: [] });

  const load = useCallback(async () => {
    if (!getAccessToken()) return setState({ status: 'needs-login', services: [] });
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const services = pageItems(await catalogApi.getMyServices());
      const categoryIds = [...new Set(services.map((s) => s.categoryId).filter(Boolean))];
      const optional = (p) => p.catch(() => null);
      const [packageLists, categories] = await Promise.all([
        Promise.all(services.map((s) => optional(catalogApi.getPackages(s.serviceId)))),
        Promise.all(categoryIds.map((id) => optional(catalogApi.getCategoryById(id)))),
      ]);
      const categoryById = Object.fromEntries(
        categories.filter((c) => c?.result).map((c) => [c.result.categoryId, c.result])
      );
      setState({
        status: 'ready',
        services: services.map((s, i) =>
          toMyServiceRow(s, pageItems(packageLists[i]), categoryById[s.categoryId] ?? null)
        ),
      });
    } catch (err) {
      const status = err?.status === 401 ? 'needs-login' : err?.status === 403 ? 'forbidden' : 'error';
      setState({ status, services: [] });
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => window.removeEventListener('workgo-auth-changed', load);
  }, [load]);

  const deleteService = useCallback(async (serviceId) => {
    await catalogApi.deleteService(serviceId);
    setState((s) => ({ ...s, services: s.services.filter((x) => x.serviceId !== serviceId) }));
  }, []);

  return { ...state, reload: load, deleteService };
}

export default useMyServices;
