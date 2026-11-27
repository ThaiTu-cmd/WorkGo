import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';
import { providerApi } from '../api/providerApi';
import { pageItems, toServiceCard } from '../api/adapters';
import { countByRootCategory, listPublishedServices } from '../api/catalogListing';

// Every PUBLISHED service as ServiceCard items, plus the root category id of
// each (for per-category counts).
async function fetchServiceCards() {
  const { services, categories } = await listPublishedServices();
  if (services.length === 0) return [];
  const categoryById = Object.fromEntries(categories.map((c) => [c.categoryId, c]));

  // Providers (name / verified badge), packages (delivery time for the
  // "Thời gian giao" filter) and media (cover image; the list endpoint has
  // none) are optional: a failure leaves them empty.
  const providerIds = [...new Set(services.map((s) => s.providerId).filter(Boolean))];
  const [providers, packageLists, mediaLists] = await Promise.all([
    Promise.all(providerIds.map((id) => providerApi.getProvider(id).then((r) => r?.result ?? null, () => null))),
    Promise.all(services.map((s) => catalogApi.getPackages(s.serviceId).then((r) => pageItems(r), () => null))),
    Promise.all(services.map((s) => catalogApi.getMedias(s.serviceId, 0, 10).then((r) => pageItems(r), () => null))),
  ]);
  const providerById = Object.fromEntries(providers.filter(Boolean).map((p) => [p.providerProfileId, p]));

  return services.map((s, i) => {
    const category = categoryById[s.categoryId];
    return {
      ...toServiceCard(s, {
        category,
        provider: providerById[s.providerId],
        packages: packageLists[i],
        medias: mediaLists[i],
      }),
      rootCategoryId: category?.parent ?? s.categoryId,
    };
  });
}

// One load shared by every component that mounts the hook at the same time
// (home renders PopularServices and FeaturedCategories), reused for 30 s.
const SHARE_MS = 30_000;
let shared = null; // { promise, at }
// `force` (sign-in/out) skips the cache, but hooks reacting to the same event
// within a second still share that one fresh load.
function loadShared(force = false) {
  if (shared && Date.now() - shared.at < (force ? 1000 : SHARE_MS)) return shared.promise;
  const promise = fetchServiceCards();
  shared = { promise, at: Date.now() };
  promise.catch(() => {
    if (shared?.promise === promise) shared = null;
  });
  return promise;
}

// status: 'loading' | 'ready' | 'needs-login' | 'error'
export function useServiceList() {
  const [state, setState] = useState({ status: 'loading', services: [] });

  useEffect(() => {
    let cancelled = false;

    const load = async (force = false) => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const services = await loadShared(force);
        if (!cancelled) setState({ status: 'ready', services });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: err?.status === 401 ? 'needs-login' : 'error',
            services: [],
          });
        }
      }
    };
    // Signing in or out can change what the backend returns: load again.
    const onAuthChanged = () => load(true);

    load();
    window.addEventListener('workgo-auth-changed', onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', onAuthChanged);
    };
  }, []);

  return state;
}

export { countByRootCategory };

// Real per-category counts ({ [rootCategoryId]: n }), or null until the
// services have loaded (callers then show no number).
export function useCategoryCounts() {
  const { status, services } = useServiceList();
  return status === 'ready' ? countByRootCategory(services) : null;
}

export default useServiceList;
