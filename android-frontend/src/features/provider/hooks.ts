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
  currentSlug?: string;
  currentStatus?: ServiceStatus;
  info: ServiceInfo;
  packages: PackageInput[];
  images: string[];
  hasCover: boolean;
};

// What a previous, partly failed save already wrote, so a retry continues
// instead of creating the service again.
export type SaveProgress = {
  serviceId?: string;
  slug?: string;
  packageIds: Record<number, string>;
  mediaSaved: number;
  published: boolean;
};

export const newSaveProgress = (): SaveProgress => ({ packageIds: {}, mediaSaved: 0, published: false });

// Slugs are unique across all providers: suffix the title so two "Sửa máy lạnh" can coexist.
const uniqueSlug = (title: string) => `${slugify(title)}-${Math.random().toString(36).slice(2, 6).padEnd(4, '0')}`;

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
// Pass the same `progress` again to retry after a failure.
export async function saveService(input: SaveServiceInput, progress: SaveProgress = newSaveProgress()): Promise<string> {
  const isNew = !input.serviceId;
  const body = {
    categoryId: input.info.categoryId,
    executionType: input.info.executionType,
    title: input.info.title.trim(),
    slug: input.currentSlug ?? progress.slug ?? uniqueSlug(input.info.title),
    description: input.info.description.trim(),
    basePrice: Math.min(...input.packages.map((p) => p.price)),
    currency: 'VND',
  };

  let serviceId = input.serviceId ?? progress.serviceId;
  if (!serviceId) {
    progress.slug = body.slug;
    serviceId = (await catalogApi.createService(body)).result.serviceId;
    progress.serviceId = serviceId;
  } else if (!isNew) {
    // PUT writes nulls too: always send the status the service already has.
    await catalogApi.updateService(serviceId, { ...body, status: input.currentStatus ?? 'DRAFT' });
  }

  for (const [i, p] of input.packages.entries()) {
    if (p.id) await catalogApi.updatePackage(p.id, packageBody(p));
    else if (!progress.packageIds[i]) {
      const created = await catalogApi.createPackage(serviceId, packageBody(p));
      progress.packageIds[i] = created?.result?.packageId ?? 'created';
    }
  }
  for (let i = progress.mediaSaved; i < input.images.length; i++) {
    await catalogApi.createMedia(serviceId, { url: input.images[i], mediaType: 'IMAGE', cover: !input.hasCover && i === 0 });
    progress.mediaSaved = i + 1;
  }
  if (isNew && !progress.published) {
    await catalogApi.setServiceStatus(serviceId, 'PUBLISHED');
    progress.published = true;
  }
  return serviceId;
}

export function useSaveService() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ input, progress }: { input: SaveServiceInput; progress: SaveProgress }) => saveService(input, progress),
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
