import { pageItems, toServiceCard, type ServiceCard } from '@/api/adapters';
import { catalogApi } from '@/api/catalogApi';
import { providerApi } from '@/api/providerApi';
import type { CategoryDto, ExecutionType, ProviderProfileDto, ServiceDto } from '@/api/types';

const EXECUTION_TYPES: ExecutionType[] = ['DIGITAL', 'ONSITE'];
const PRICE_FLOOR = 0;
const PRICE_CEILING = 1_000_000_000_000;

// Root categories plus their direct children.
export function flattenCategories(roots: CategoryDto[]): CategoryDto[] {
  return roots.flatMap((root) => [root, ...(root.children ?? []).map((child) => ({ ...child, parent: root.categoryId }))]);
}

// Every PUBLISHED service as ServiceCard items. GET /catalog/services only
// matches when all four filters are sent, so this asks once per
// (category × execution type) with a wide price range and merges by id.
// Provider names need a token; guests get the default name.
export async function listAllServices(): Promise<ServiceCard[]> {
  const categories = flattenCategories(pageItems<CategoryDto>(await catalogApi.getRootCategories()));
  const categoryById = new Map(categories.map((c) => [c.categoryId, c]));

  const pages = await Promise.all(
    categories.flatMap((c) =>
      EXECUTION_TYPES.map((executionType) =>
        catalogApi
          .listServices({ categoryId: c.categoryId, executionType, minPrice: PRICE_FLOOR, maxPrice: PRICE_CEILING })
          .catch(() => null)
      )
    )
  );
  const byId = new Map<string, ServiceDto>();
  pages.forEach((p) => pageItems<ServiceDto>(p).forEach((s) => byId.set(s.serviceId, s)));
  const services = [...byId.values()];

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
