import type { ServiceCard } from '@/api/adapters';
import type { ExecutionType } from '@/api/types';

export type ServiceFilters = {
  query?: string;
  categoryId?: string;
  executionType?: ExecutionType;
  minPrice?: number;
  maxPrice?: number;
};

// Lower-case and strip Vietnamese diacritics so "sua may lanh" finds "Sửa máy lạnh".
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// The API has no keyword search: filtering runs on the full list on the device.
export function filterServices(cards: ServiceCard[], f: ServiceFilters): ServiceCard[] {
  const q = f.query ? fold(f.query) : '';
  return cards.filter((c) => {
    if (f.categoryId && c.categoryId !== f.categoryId) return false;
    if (f.executionType && c.executionType !== f.executionType) return false;
    if (f.minPrice !== undefined && c.basePrice < f.minPrice) return false;
    if (f.maxPrice !== undefined && c.basePrice > f.maxPrice) return false;
    if (!q) return true;
    return [c.title, c.categoryName, c.provider.name].some((field) => fold(field).includes(q));
  });
}
