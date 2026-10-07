import { apiFetch } from "../api-client";

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

export interface BackendCategoryResponse {
  categoryId?: string | number;
  id?: string | number;
  name?: string;
  categoryName?: string;
  description?: string;
  iconUrl?: string;
  parent?: string | number | null;
  parentId?: string | number | null;
}

// Mapper chuẩn hóa từ CategoryResponse của Spring Boot
export function mapBackendCategory(raw: BackendCategoryResponse): CategoryItem {
  return {
    categoryId: String(raw.categoryId || raw.id || ""),
    categoryName: String(raw.name || raw.categoryName || "Danh mục"),
    description: raw.description || "",
    iconUrl: raw.iconUrl || undefined,
    parentId: raw.parent ? String(raw.parent) : raw.parentId ? String(raw.parentId) : null,
  };
}

export const catalogApi = {
  async getCategories(): Promise<CategoryItem[]> {
    try {
      // Call through BFF proxy route without cross-origin port 8082
      const res = await apiFetch<{
        result?: { data?: BackendCategoryResponse[] } | BackendCategoryResponse[];
        data?: BackendCategoryResponse[];
      } | BackendCategoryResponse[]>("/api/proxy/catalog/categories/roots?page=0&size=20");
      
      let items: BackendCategoryResponse[] = [];
      if (res && "result" in res && res.result) {
        if ("data" in res.result && Array.isArray(res.result.data)) {
          items = res.result.data;
        } else if (Array.isArray(res.result)) {
          items = res.result;
        }
      } else if (res && "data" in res && Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res)) {
        items = res;
      }

      if (items.length > 0) {
        return items.map(mapBackendCategory);
      }
      return DEFAULT_CATEGORIES;
    } catch {
      // Fallback gracefully when catalog service is offline or not reachable
      return DEFAULT_CATEGORIES;
    }
  },
};
