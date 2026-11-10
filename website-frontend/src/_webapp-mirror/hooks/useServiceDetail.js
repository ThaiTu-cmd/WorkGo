import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { providerApi } from '../api/providerApi';
import { pageItems, toServiceDetail } from '../api/adapters';

// One service from catalog-service plus its packages / add-ons / media,
// the category name and the provider profile (identity-service).
// status: 'loading' | 'ready' | 'needs-login' | 'not-found' | 'error'
export function useServiceDetail(serviceId) {
  const [state, setState] = useState({ status: 'loading', service: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!serviceId) return setState({ status: 'not-found', service: null });
      setState({ status: 'loading', service: null });
      try {
        const serviceRes = await catalogApi.getService(serviceId);
        const service = serviceRes?.result;
        if (!service) throw Object.assign(new Error('not found'), { status: 404 });

        // Side data is optional: a failure there should not hide the service.
        const optional = (p) => p.catch(() => null);
        const [packages, addons, medias, category, provider] = await Promise.all([
          catalogApi.getPackages(serviceId),
          optional(catalogApi.getAddons(serviceId)),
          optional(catalogApi.getMedias(serviceId)),
          service.categoryId ? optional(catalogApi.getCategoryById(service.categoryId)) : null,
          service.providerId ? optional(providerApi.getProvider(service.providerId)) : null,
        ]);
        if (cancelled) return;
        setState({
          status: 'ready',
          service: toServiceDetail({
            service,
            packages: pageItems(packages),
            addons: pageItems(addons),
            medias: pageItems(medias),
            category: category?.result ?? null,
            provider: provider?.result ?? null,
          }),
        });
      } catch (err) {
        if (cancelled) return;
        const status =
          err?.status === 401 ? 'needs-login' : err?.status === 404 || err?.status === 400 ? 'not-found' : 'error';
        setState({ status, service: null });
      }
    };

    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', load);
    };
  }, [serviceId]);

  return state;
}

export default useServiceDetail;
