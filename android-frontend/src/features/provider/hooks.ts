import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { pageItems, toMyServiceRow } from '@/api/adapters';
import { availabilityApi, type RuleBody } from '@/api/availabilityApi';
import { catalogApi } from '@/api/catalogApi';
import { ApiError } from '@/api/errors';
import { providerApi } from '@/api/providerApi';
import { qk } from '@/api/queryKeys';
import type { BookingSlotDto, PackageDto, RuleDto, ServiceDto, ServiceStatus } from '@/api/types';

import type { PackageInput, ServiceInfo } from './serviceFormSchema';
import { slugify } from './slugify';

export const isForbidden = (err: unknown) => err instanceof ApiError && err.status === 403;

// 404/400 from /providers/myProfile means "no profile yet", not an error to show.
export function useMyProviderProfile(enabled: boolean) {
  return useQuery({
    queryKey: qk.providerMe(),
    enabled,
    queryFn: async () => {
      try {
        return (await providerApi.getMyProfile()).result ?? null;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
        throw err;
      }
    },
  });
}

export function useCreateProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: providerApi.createProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.providerMe() }),
  });
}

export function useMyServices(enabled: boolean) {
  return useQuery({
    queryKey: qk.myServices(),
    enabled,
    retry: (count, err) => !isForbidden(err) && count < 1,
    queryFn: async () => {
      const services = pageItems<ServiceDto>(await catalogApi.getMyServices());
      const packages = await Promise.all(
        services.map((s) => catalogApi.getPackages(s.serviceId).then((r) => pageItems<PackageDto>(r), () => []))
      );
      return services.map((s, i) => toMyServiceRow(s, packages[i]));
    },
  });
}

function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.myServices() });
    void queryClient.invalidateQueries({ queryKey: qk.services() });
  };
}

export function useSetServiceStatus() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ serviceId, status }: { serviceId: string; status: ServiceStatus }) => catalogApi.setServiceStatus(serviceId, status),
    onSuccess: invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({ mutationFn: (serviceId: string) => catalogApi.deleteService(serviceId), onSuccess: invalidate });
}

export type SaveServiceInput = {
  serviceId: string | null;
  currentStatus?: ServiceStatus;
  info: ServiceInfo;
  packages: PackageInput[];
  images: string[];
  hasCover: boolean;
};

const packageBody = (p: PackageInput) => ({
  name: p.name.trim(),
  description: '',
  price: p.price,
  currency: 'VND',
  deliveryDay: p.deliveryDay ?? null,
  durationMinute: p.durationMinute ?? null,
  revisionLimit: p.revisionLimit ?? null,
});

// Service, then its packages, then its images — the catalog API has no
// single "save everything" endpoint. A new service is published right away.
export async function saveService(input: SaveServiceInput): Promise<string> {
  const basePrice = Math.min(...input.packages.map((p) => p.price));
  const body = {
    categoryId: input.info.categoryId,
    executionType: input.info.executionType,
    title: input.info.title.trim(),
    slug: slugify(input.info.title),
    description: input.info.description.trim(),
    basePrice,
    currency: 'VND',
  };

  let serviceId = input.serviceId;
  if (serviceId) {
    // PUT writes nulls too: always send the status the service already has.
    await catalogApi.updateService(serviceId, { ...body, status: input.currentStatus ?? 'DRAFT' });
  } else {
    serviceId = (await catalogApi.createService(body)).result.serviceId;
  }

  for (const p of input.packages) {
    if (p.id) await catalogApi.updatePackage(p.id, packageBody(p));
    else await catalogApi.createPackage(serviceId, packageBody(p));
  }
  for (const [i, url] of input.images.entries()) {
    await catalogApi.createMedia(serviceId, { url, mediaType: 'IMAGE', cover: !input.hasCover && i === 0 });
  }
  if (!input.serviceId) await catalogApi.setServiceStatus(serviceId, 'PUBLISHED');
  return serviceId;
}

export function useSaveService() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: saveService,
    onSuccess: (serviceId) => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: qk.service(serviceId) });
    },
  });
}

export function useRules(serviceId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.rules(serviceId),
    enabled,
    queryFn: async () =>
      pageItems<RuleDto>(await availabilityApi.getRules(serviceId)).sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek || Date.parse(a.startTime) - Date.parse(b.startTime)
      ),
  });
}

export function useSlots(serviceId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.slots(serviceId),
    enabled,
    queryFn: async () =>
      pageItems<BookingSlotDto>(await availabilityApi.getSlots(serviceId))
        .filter((s) => Date.parse(s.startedAt) > Date.now())
        .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt)),
  });
}

export function useSaveRule(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, body }: { ruleId: string | null; body: RuleBody }) =>
      ruleId ? availabilityApi.updateRule(ruleId, body) : availabilityApi.createRule(serviceId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.rules(serviceId) });
      void queryClient.invalidateQueries({ queryKey: qk.slots(serviceId) });
    },
  });
}

export function useDeleteRule(serviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => availabilityApi.deleteRule(ruleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.rules(serviceId) });
      void queryClient.invalidateQueries({ queryKey: qk.slots(serviceId) });
    },
  });
}
