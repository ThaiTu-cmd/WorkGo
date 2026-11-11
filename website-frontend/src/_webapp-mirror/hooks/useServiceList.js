import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { providerApi } from '../api/providerApi';
import { pageItems, toServiceCard } from '../api/adapters';
import { listPublishedServices } from '../api/catalogListing';

// Every PUBLISHED service from catalog-service, as ServiceCard items.
// Loads strictly real services from PostgreSQL via catalogApi.
// status: 'loading' | 'ready' | 'needs-login' | 'error'
export function useServiceList() {
  const [state, setState] = useState({ status: 'loading', services: [] });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const { services, categories } = await listPublishedServices();
        if (services.length === 0) {
          if (!cancelled) setState({ status: 'ready', services: [] });
          return;
        }
        const categoryById = Object.fromEntries(categories.map((c) => [c.categoryId, c]));

        // Providers (name / verified badge) and packages (delivery time for the
        // "Thời gian giao" filter) are optional: a failure leaves them empty.
        const providerIds = [...new Set(services.map((s) => s.providerId).filter(Boolean))];
        const [providers, packageLists] = await Promise.all([
          Promise.all(
            providerIds.map((id) => providerApi.getProvider(id).then((r) => r?.result ?? null, () => null))
          ),
          Promise.all(
            services.map((s) => catalogApi.getPackages(s.serviceId).then((r) => pageItems(r), () => null))
          ),
        ]);
        const providerById = Object.fromEntries(providers.filter(Boolean).map((p) => [p.providerProfileId, p]));

        if (cancelled) return;
        setState({
          status: 'ready',
          services: services.map((s, i) =>
            toServiceCard(s, {
              category: categoryById[s.categoryId],
              provider: providerById[s.providerId],
              packages: packageLists[i],
            })
          ),
        });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: err?.status === 401 ? 'needs-login' : 'error',
            services: [],
          });
        }
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

export default useServiceList;
