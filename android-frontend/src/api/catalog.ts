import { apiFetch } from './client';

export interface MobileCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string | null;
}

interface SpringPage<T> {
  content?: T[];
  data?: T[];
  page?: {
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export const catalogApi = {
  async getRootCategories(page = 0, size = 20): Promise<MobileCategory[]> {
    try {
      const res = await apiFetch<SpringPage<{
        id: string;
        name: string;
        slug: string;
        parent_id?: string | null;
      }>>(`/api/v1/catalog/categories/roots?page=${page}&size=${size}`);

      const items = res.content || res.data || [];
      return items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parent_id,
        icon: getCategoryIcon(c.slug),
      }));
    } catch {
      // Truthful empty fallback on network or service error
      return [];
    }
  },
};

function getCategoryIcon(slug: string): string {
  if (slug.includes('design') || slug.includes('thiet-ke')) return '🎨';
  if (slug.includes('code') || slug.includes('lap-trinh')) return '💻';
  if (slug.includes('writing') || slug.includes('viet-lach')) return '✍️';
  if (slug.includes('repair') || slug.includes('ky-thuat')) return '🔧';
  if (slug.includes('delivery') || slug.includes('giao-hang')) return '🚚';
  return '💼';
}
