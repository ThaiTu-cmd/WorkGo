import type { ExecutionType } from '@/api/types';

import type { ServiceFilters } from './filterServices';

const EXECUTION_TYPES: ExecutionType[] = ['DIGITAL', 'ONSITE'];

// Filters another screen asked Explore to open with (home category tile, "Xem tất cả").
export function filtersFromParams(params: { categoryId?: string; executionType?: string }): ServiceFilters {
  const filters: ServiceFilters = {};
  if (params.categoryId) filters.categoryId = params.categoryId;
  if (EXECUTION_TYPES.includes(params.executionType as ExecutionType)) filters.executionType = params.executionType as ExecutionType;
  return filters;
}
