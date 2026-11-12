import { pageItems, toServiceCard, type ServiceCard } from '@/api/adapters';
import { catalogApi } from '@/api/catalogApi';
import { providerApi } from '@/api/providerApi';
import type { CategoryDto, ProviderProfileDto, ServiceDto } from '@/api/types';

const PAGE_SIZE = 100;

// Root categories plus their direct children.
export function flattenCategories(roots: CategoryDto[]): CategoryDto[] {
  return roots.flatMap((root) => [root, ...(root.children ?? []).map((child) => ({ ...child, parent: root.categoryId }))]);
}

// Every PUBLISHED service, page by page (GET /catalog/services with no filters).
// Merged by id in case a service moves between pages while reading.
async function listPublished(): Promise<ServiceDto[]> {
  const byId = new Map<string, ServiceDto>();
  for (let page = 0; ; page++) {
    const res = await catalogApi.listServices({ page, size: PAGE_SIZE });
    pageItems<ServiceDto>(res).forEach((s) => byId.set(s.serviceId, s));
    const totalPages = res?.result?.totalPages;
    if (totalPages === undefined || page + 1 >= totalPages) break;
  }
  return [...byId.values()];
}

// Every PUBLISHED service as ServiceCard items.
// Provider names need a token; guests get the default name.
export async function listAllServices(): Promise<ServiceCard[]> {
  const categories = flattenCategories(pageItems<CategoryDto>(await catalogApi.getRootCategories()));
  const categoryById = new Map(categories.map((c) => [c.categoryId, c]));
  const services = await listPublished();

  const providerIds = [...new Set(services.map((s) => s.providerId).filter(Boolean))];
  const profiles = await Promise.all(
    providerIds.map((id) => providerApi.getProvider(id).then((r) => r?.result ?? null, () => null))
  );
  const providerById = new Map(
    profiles.filter((p): p is ProviderProfileDto => Boolean(p)).map((p) => [p.providerProfileId, p])
  );

  return services.map((s) =>
    toServiceCard(s, { category: categoryById.get(s.categoryId), provider: providerById.get(s.providerId) })
  );
}
