import { useQuery } from '@tanstack/react-query';

import { pageItems, toServiceDetail } from '@/api/adapters';
import { catalogApi } from '@/api/catalogApi';
import { providerApi } from '@/api/providerApi';
import { qk } from '@/api/queryKeys';
import type { AddonDto, CategoryDto, MediaDto, PackageDto } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';

import { flattenCategories, listAllServices } from './listAllServices';

// Provider names are only readable with a token, so the list is keyed by
// whether the user is signed in.
export function useServices() {
  const { status } = useAuth();
  return useQuery({
    queryKey: [...qk.services(), status === 'signedIn'],
    queryFn: listAllServices,
    enabled: status !== 'loading',
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories(),
    queryFn: async () => {
      const roots = pageItems<CategoryDto>(await catalogApi.getRootCategories());
      return { roots, all: flattenCategories(roots) };
    },
  });
}

export function useServiceDetail(id: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: [...qk.service(id ?? ''), status === 'signedIn'],
    enabled: Boolean(id) && status !== 'loading',
    queryFn: async () => {
      const serviceId = id as string;
      const [serviceRes, packagesRes, addonsRes, mediasRes] = await Promise.all([
        catalogApi.getService(serviceId),
        catalogApi.getPackages(serviceId).catch(() => null),
        catalogApi.getAddons(serviceId).catch(() => null),
        catalogApi.getMedias(serviceId).catch(() => null),
      ]);
      const service = serviceRes.result;
      const [provider, category] = await Promise.all([
        providerApi.getProvider(service.providerId).then((r) => r?.result ?? null, () => null),
        catalogApi.getCategoryById(service.categoryId).then((r) => r?.result ?? null, () => null),
      ]);
      return toServiceDetail({
        service,
        packages: pageItems<PackageDto>(packagesRes),
        addons: pageItems<AddonDto>(addonsRes),
        medias: pageItems<MediaDto>(mediasRes),
        provider,
        category,
      });
    },
  });
}
