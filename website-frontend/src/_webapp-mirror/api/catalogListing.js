import { catalogApi } from './catalogApi.js';
import { pageItems } from './adapters.js';

export const EXECUTION_TYPES = ['DIGITAL', 'ONSITE'];
const PAGE_SIZE = 100;

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

  // GET /catalog/services with no filters, page by page; merged by id in case
  // a service moves between pages while reading.
  const byId = new Map();
  for (let page = 0; ; page++) {
    const res = await api.listServices({ page, size: PAGE_SIZE });
    pageItems(res).forEach((s) => byId.set(s.serviceId, s));
    const totalPages = res?.result?.totalPages;
    if (totalPages === undefined || page + 1 >= totalPages) break;
  }
  const services = [...byId.values()].filter((s) => executionTypes.includes(s.executionType));
  return { services, categories };
}

// Number of listed services per root category id (cards carry rootCategoryId).
export const countByRootCategory = (services = []) =>
  services.reduce((acc, s) => {
    if (s.rootCategoryId) acc[s.rootCategoryId] = (acc[s.rootCategoryId] || 0) + 1;
    return acc;
  }, {});

export default listPublishedServices;
