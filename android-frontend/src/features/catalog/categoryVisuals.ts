import type Ionicons from '@expo/vector-icons/Ionicons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type CategoryVisual = { icon: IconName; bg: string; fg: string; short: string };

// Icon, tile colours and short grid label per root category slug (catalog seed).
const VISUALS: Record<string, CategoryVisual> = {
  'thiet-ke-do-hoa': { icon: 'color-palette-outline', bg: '#EEEDFE', fg: '#534AB7', short: 'Thiết kế' },
  'lap-trinh-it': { icon: 'code-slash-outline', bg: '#E6F1FB', fg: '#185FA5', short: 'Lập trình' },
  'viet-lach-dich-thuat': { icon: 'create-outline', bg: '#FBEAF0', fg: '#993556', short: 'Viết lách' },
  'marketing-quang-cao': { icon: 'megaphone-outline', bg: '#FAECE7', fg: '#993C1D', short: 'Marketing' },
  'sua-chua-bao-tri': { icon: 'construct-outline', bg: '#FAEEDA', fg: '#854F0B', short: 'Sửa chữa' },
  've-sinh-don-dep': { icon: 'sparkles-outline', bg: '#E1F5EE', fg: '#0F6E56', short: 'Vệ sinh' },
  'van-chuyen-giao-hang': { icon: 'car-outline', bg: '#F1EFE8', fg: '#5F5E5A', short: 'Vận chuyển' },
  'giao-duc-gia-su': { icon: 'school-outline', bg: '#EAF3DE', fg: '#3B6D11', short: 'Gia sư' },
};

const FALLBACK: CategoryVisual = { icon: 'grid-outline', bg: '#F1EFE8', fg: '#5F5E5A', short: 'Khác' };

export function categoryVisual(slug: string | null | undefined): CategoryVisual {
  return (slug && VISUALS[slug]) || FALLBACK;
}
