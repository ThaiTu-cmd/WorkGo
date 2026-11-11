import { catalogApi } from './catalogApi.js';
import { pageItems } from './adapters.js';

// GET /catalog/services only returns rows when categoryId, executionType,
// minPrice and maxPrice are ALL sent, so "every published service" means one
// call per (category × execution type) with an open price range.
export const EXECUTION_TYPES = ['DIGITAL', 'ONSITE'];
const PRICE_FLOOR = 0;
const PRICE_CEILING = 1_000_000_000_000;

// Root categories plus their direct children.
export const flattenCategories = (roots = []) =>
  roots.flatMap((root) => [
    root,
    ...[...(root.children || [])].map((child) => ({ ...child, parent: root.categoryId })),
  ]);

// Every PUBLISHED service (deduplicated), optionally only some execution types.
// Returns { services: ServiceResponse[], categories } — categories is the
// flattened list the services were read from, for name/slug lookups.
export async function listPublishedServices({ executionTypes = EXECUTION_TYPES, api = catalogApi } = {}) {
  const roots = pageItems(await api.getRootCategories());
  const categories = flattenCategories(roots);
  if (categories.length === 0) return { services: [], categories };

  const pages = await Promise.all(
    categories.flatMap((c) =>
      executionTypes.map((executionType) =>
        api
          .listServices({ categoryId: c.categoryId, executionType, minPrice: PRICE_FLOOR, maxPrice: PRICE_CEILING })
          .catch(() => null)
      )
    )
  );
  const byId = new Map();
  pages.forEach((p) => pageItems(p).forEach((s) => byId.set(s.serviceId, s)));
  return { services: [...byId.values()], categories };
}

// Number of listed services per root category id (cards carry rootCategoryId).
export const countByRootCategory = (services = []) =>
  services.reduce((acc, s) => {
    if (s.rootCategoryId) acc[s.rootCategoryId] = (acc[s.rootCategoryId] || 0) + 1;
    return acc;
  }, {});

export default listPublishedServices;
