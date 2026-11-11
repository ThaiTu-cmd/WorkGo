import { http } from './client';
import type { AddonDto, ApiResponse, CategoryDto, ExecutionType, MediaDto, PackageDto, Paged, ServiceDto, ServiceStatus } from './types';

export type ServiceBody = {
  categoryId: string;
  executionType: ExecutionType;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  currency: string;
  status?: ServiceStatus;
};

export type PackageBody = {
  name: string;
  description?: string;
  price: number;
  currency: string;
  deliveryDay?: number | null;
  durationMinute?: number | null;
  revisionLimit?: number | null;
};

// catalog-service via gateway: /api/v1/catalog/**. GETs are public, writes need a provider token.
export const catalogApi = {
  getRootCategories: (page = 0, size = 50) =>
    http.get<Paged<CategoryDto>>('/catalog/categories/roots', { params: { page, size } }),

  getCategoryById: (categoryId: string) => http.get<ApiResponse<CategoryDto>>(`/catalog/categories/${categoryId}`),

  getChildCategories: (parentId: string, page = 0, size = 50) =>
    http.get<Paged<CategoryDto>>(`/catalog/categories/${parentId}/children`, { params: { page, size } }),

  getService: (serviceId: string) => http.get<ApiResponse<ServiceDto>>(`/catalog/services/${serviceId}`),

  // PUBLISHED services. The endpoint only matches when categoryId,
  // executionType, minPrice and maxPrice are ALL present (see listAllServices).
  listServices: ({
    categoryId,
    executionType,
    minPrice,
    maxPrice,
    page = 0,
    size = 50,
  }: { categoryId?: string; executionType?: ExecutionType; minPrice?: number; maxPrice?: number; page?: number; size?: number } = {}) =>
    http.get<Paged<ServiceDto>>('/catalog/services', {
      params: { page, size, categoryId, executionType, minPrice, maxPrice },
    }),

  getMyServices: (page = 0, size = 50) =>
    http.get<Paged<ServiceDto>>('/catalog/services/my-services', { params: { page, size } }),

  createService: (body: ServiceBody) => http.post<ApiResponse<ServiceDto>>('/catalog/services', body),

  updateService: (serviceId: string, body: ServiceBody) => http.put<ApiResponse<ServiceDto>>(`/catalog/services/${serviceId}`, body),

  deleteService: (serviceId: string) => http.delete<ApiResponse<unknown>>(`/catalog/services/${serviceId}`),

  // The update mapper writes nulls too, so re-send the whole record with the new status.
  setServiceStatus: async (serviceId: string, status: ServiceStatus) => {
    const current = (await http.get<ApiResponse<ServiceDto>>(`/catalog/services/${serviceId}`))?.result;
    if (!current) throw new Error('Không tìm thấy dịch vụ');
    return http.put<ApiResponse<ServiceDto>>(`/catalog/services/${serviceId}`, {
      categoryId: current.categoryId,
      executionType: current.executionType,
      title: current.title,
      slug: current.slug,
      description: current.description,
      currency: current.currency,
      basePrice: current.basePrice,
      status,
    });
  },

  createPackage: (serviceId: string, body: PackageBody) =>
    http.post<ApiResponse<PackageDto>>(`/catalog/packages/services/${serviceId}`, body),

  updatePackage: (packageId: string, body: PackageBody) => http.put<ApiResponse<PackageDto>>(`/catalog/packages/${packageId}`, body),

  createMedia: (serviceId: string, body: { url: string; mediaType: 'IMAGE' | 'VIDEO' | 'FILE'; cover: boolean }) =>
    http.post<ApiResponse<MediaDto>>(`/catalog/medias/services/${serviceId}`, body),

  getPackages: (serviceId: string, page = 0, size = 20) =>
    http.get<Paged<PackageDto>>(`/catalog/packages/services/${serviceId}`, { params: { page, size } }),

  getAddons: (serviceId: string, page = 0, size = 20) =>
    http.get<Paged<AddonDto>>(`/catalog/addons/service/${serviceId}`, { params: { page, size } }),

  getMedias: (serviceId: string, page = 0, size = 20) =>
    http.get<Paged<MediaDto>>(`/catalog/medias/services/${serviceId}`, { params: { page, size } }),
};
