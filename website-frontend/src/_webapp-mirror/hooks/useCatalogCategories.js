import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalogApi';

// Visual and layout metadata keyed by real category slug in catalog_db
export const CATEGORY_META = {
  'thiet-ke-do-hoa': {
    iconName: 'Palette',
    accentColor: '#EC4899',
    executionType: 'DIGITAL',
    executionLabel: 'Online',
    popularTags: ['Logo Branding', 'Figma UI/UX', 'Banner Ads'],
  },
  'lap-trinh-it': {
    iconName: 'Code2',
    accentColor: '#1dbf73',
    executionType: 'DIGITAL',
    executionLabel: 'Online',
    popularTags: ['Web Next.js', 'App Mobile', 'API & Cloud'],
  },
  'viet-lach-dich-thuat': {
    iconName: 'PenLine',
    accentColor: '#8B5CF6',
    executionType: 'DIGITAL',
    executionLabel: 'Online',
    popularTags: ['Bài viết chuẩn SEO', 'Dịch thuật', 'Content Marketing'],
  },
  'marketing-quang-cao': {
    iconName: 'Megaphone',
    accentColor: '#F97316',
    executionType: 'DIGITAL',
    executionLabel: 'Online',
    popularTags: ['Facebook Ads', 'Google Ads', 'SEO Fanpage'],
  },
  'sua-chua-bao-tri': {
    iconName: 'Wrench',
    accentColor: '#F59E0B',
    executionType: 'ONSITE',
    executionLabel: 'Tại nhà',
    popularTags: ['Điện nước dân dụng', 'Điện lạnh', 'Sửa máy giặt'],
  },
  've-sinh-don-dep': {
    iconName: 'Sparkles',
    accentColor: '#10B981',
    executionType: 'ONSITE',
    executionLabel: 'Tại nhà',
    popularTags: ['Dọn dẹp theo giờ', 'Giặt sofa nệm', 'Vệ sinh công nghiệp'],
  },
  'van-chuyen-giao-hang': {
    iconName: 'Truck',
    accentColor: '#06B6D4',
    executionType: 'ONSITE',
    executionLabel: 'Giao nhận',
    popularTags: ['Giao hàng hỏa tốc', 'Chuyển nhà trọn gói', 'Bốc xếp xe tải'],
  },
  'giao-duc-gia-su': {
    iconName: 'GraduationCap',
    accentColor: '#6366F1',
    executionType: 'DIGITAL',
    executionLabel: 'Đặt lịch',
    popularTags: ['Luyện thi IELTS', 'Gia sư Toán', 'Dạy kèm 1-1'],
  },
};

// Root categories from catalog-service (public, no sign-in needed).
// All categories are loaded strictly from the real backend database.
// status: 'loading' | 'api' | 'needs-login' | 'error' | 'empty'
export function useCatalogCategories() {
  const [state, setState] = useState({ categories: [], status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const res = await catalogApi.getRootCategories();
        if (cancelled) return;
        const apiData = res?.result?.data ?? [];
        const enriched = apiData.map((cat) => {
          const meta = CATEGORY_META[cat.slug] || {};
          return {
            ...cat,
            iconName: meta.iconName || 'Default',
            accentColor: meta.accentColor || '#1dbf73',
            executionType: meta.executionType || 'DIGITAL',
            executionLabel: meta.executionLabel || null,
            popularTags: meta.popularTags || (cat.children || []).map((c) => c.name),
          };
        });

        setState({
          categories: enriched,
          status: enriched.length > 0 ? 'api' : 'empty',
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          categories: [],
          status: err?.status === 401 ? 'needs-login' : 'error',
        });
      }
    };

    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', load);
    };
  }, []);

  return state;
}

export default useCatalogCategories;
