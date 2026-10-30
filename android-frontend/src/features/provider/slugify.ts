import { fold } from '@/features/catalog/filterServices';

// catalog-service wants a URL slug per service; derive it from the title.
export function slugify(title: string): string {
  return fold(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
