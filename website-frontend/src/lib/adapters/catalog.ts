import { apiFetch, type Page } from "../api-client";

export interface CategoryItem {
  categoryId: string;
  categoryName: string;
  description?: string;
  iconUrl?: string;
  parentId?: string | null;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { categoryId: "cat-1", categoryName: "Thiết kế & Đồ họa", description: "UI/UX, Logo, Banner" },
  { categoryId: "cat-2", categoryName: "Lập trình & Công nghệ", description: "Web, Mobile, Backend" },
  { categoryId: "cat-3", categoryName: "Viết lách & Dịch thuật", description: "Content, Copywriting, Biên dịch" },
  { categoryId: "cat-4", categoryName: "Marketing & Truyền thông", description: "SEO, Ads, Social Media" },
  { categoryId: "cat-5", categoryName: "Sửa chữa & Kỹ thuật tại nhà", description: "Điện nước, Điện lạnh" },
  { categoryId: "cat-6", categoryName: "Vệ sinh & Gia đình", description: "Dọn dẹp nhà cửa, Giặt ủi" },
];

export const catalogApi = {
  async getCategories(): Promise<CategoryItem[]> {
    try {
      // Call through BFF proxy route without cross-origin port 8082
      const res = await apiFetch<Page<CategoryItem> | CategoryItem[]>(
        "/api/proxy/catalog/categories/roots"
      );
      if (Array.isArray(res)) return res;
      if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) {
        return res.data;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      // Fallback gracefully when catalog service is offline or not reachable
      return DEFAULT_CATEGORIES;
    }
  },
};
