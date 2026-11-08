import type { ServiceCard } from '@/api/adapters';
import type { ExecutionType } from '@/api/types';

export type HomeRail = {
  key: 'popular' | 'onsite' | 'digital' | 'new';
  title: string;
  items: ServiceCard[];
  // Filters "Xem tất cả" applies on the Explore tab.
  explore: { executionType?: ExecutionType };
};

const RAIL_SIZE = 8;

const top = (cards: ServiceCard[], by: (a: ServiceCard, b: ServiceCard) => number) => [...cards].sort(by).slice(0, RAIL_SIZE);
const byRating = (a: ServiceCard, b: ServiceCard) => b.avgRating - a.avgRating;

// Horizontal rails on the home screen; empty rails are dropped.
export function buildHomeRails(cards: ServiceCard[]): HomeRail[] {
  const rails: HomeRail[] = [
    { key: 'popular', title: 'Phổ biến nhất', items: top(cards, (a, b) => b.orderCount - a.orderCount), explore: {} },
    {
      key: 'onsite',
      title: 'Thợ tận nhà',
      items: top(cards.filter((c) => c.executionType === 'ONSITE'), byRating),
      explore: { executionType: 'ONSITE' },
    },
    {
      key: 'digital',
      title: 'Làm việc online',
      items: top(cards.filter((c) => c.executionType === 'DIGITAL'), byRating),
      explore: { executionType: 'DIGITAL' },
    },
    {
      key: 'new',
      title: 'Mới đăng',
      items: top(cards, (a, b) => Date.parse(b.createdAt ?? '') - Date.parse(a.createdAt ?? '')),
      explore: {},
    },
  ];
  return rails.filter((r) => r.items.length > 0);
}
