import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { providerApi } from '../api/providerApi';
import { pageItems, toServiceCard } from '../api/adapters';

const EXECUTION_TYPES = ['DIGITAL', 'ONSITE'];
const PRICE_FLOOR = 0;
const PRICE_CEILING = 1_000_000_000_000;

// Root categories plus their direct children, keyed by id.
const flattenCategories = (roots) =>
  roots.flatMap((root) => [
    root,
    ...[...(root.children || [])].map((child) => ({ ...child, parent: root.categoryId })),
  ]);

// Every PUBLISHED service from catalog-service, as ServiceCard items.
// GET /catalog/services only matches when all four filters are sent, so this
// asks once per (category x execution type) with a wide price range and merges.
// status: 'loading' | 'ready' | 'needs-login' | 'error'
export function useServiceList() {
  const [state, setState] = useState({ status: 'loading', services: [] });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const categories = flattenCategories(pageItems(await catalogApi.getRootCategories()));
        const categoryById = Object.fromEntries(categories.map((c) => [c.categoryId, c]));

        const pages = await Promise.all(
          categories.flatMap((c) =>
            EXECUTION_TYPES.map((executionType) =>
              catalogApi
                .listServices({
                  categoryId: c.categoryId,
                  executionType,
                  minPrice: PRICE_FLOOR,
                  maxPrice: PRICE_CEILING,
                })
                .catch(() => null)
            )
          )
        );
        const byId = new Map();
        pages.forEach((p) => pageItems(p).forEach((s) => byId.set(s.serviceId, s)));
        const services = [...byId.values()];

        const providerIds = [...new Set(services.map((s) => s.providerId).filter(Boolean))];
        const providers = await Promise.all(
          providerIds.map((id) => providerApi.getProvider(id).then((r) => r?.result ?? null, () => null))
        );
        const providerById = Object.fromEntries(providers.filter(Boolean).map((p) => [p.providerProfileId, p]));

        if (cancelled) return;
        setState({
          status: 'ready',
          services: services.map((s) =>
            toServiceCard(s, { category: categoryById[s.categoryId], provider: providerById[s.providerId] })
          ),
        });
      } catch (err) {
        if (!cancelled) setState({ status: err?.status === 401 ? 'needs-login' : 'error', services: [] });
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
