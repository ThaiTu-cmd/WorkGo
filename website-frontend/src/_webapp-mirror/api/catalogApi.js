import axiosClient, { FORBIDDEN_CODES } from './axiosClient.js';

// catalog-service via gateway: /api/v1/catalog/** (requires a Bearer token).
export const catalogApi = {
  getRootCategories: (page = 0, size = 50) =>
    axiosClient.get('/catalog/categories/roots', { params: { page, size } }),

  getCategoryById: (categoryId) => axiosClient.get(`/catalog/categories/${categoryId}`),

  getChildCategories: (parentId, page = 0, size = 50) =>
    axiosClient.get(`/catalog/categories/${parentId}/children`, { params: { page, size } }),

  getService: (serviceId) => axiosClient.get(`/catalog/services/${serviceId}`),

  // PUBLISHED services; every filter is optional.
  listServices: ({ keyword, categoryId, executionType, minPrice, maxPrice, page = 0, size = 50 } = {}) => {
    const params = { page, size };
    if (keyword) params.keyword = keyword;
    if (categoryId) params.categoryId = categoryId;
    if (executionType) params.executionType = executionType;
    if (minPrice !== undefined && minPrice !== null) params.minPrice = minPrice;
    if (maxPrice !== undefined && maxPrice !== null) params.maxPrice = maxPrice;
    return axiosClient.get('/catalog/services', { params });
  },

  getMyServices: (page = 0, size = 50) =>
    axiosClient.get('/catalog/services/my-services', { params: { page, size } }),

  // body: { categoryId, executionType, title, slug, description, basePrice, currency }
  createService: (body) => axiosClient.post('/catalog/services', body),

  // body: { categoryId, executionType, title, slug, description, currency, basePrice, status }
  updateService: (serviceId, body) => axiosClient.put(`/catalog/services/${serviceId}`, body),

  deleteService: (serviceId) => axiosClient.delete(`/catalog/services/${serviceId}`),

  // status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED'.
  setServiceStatus: (serviceId, status) =>
    axiosClient.patch(`/catalog/services/${serviceId}/status`, { status }),

  // Packages
  createPackage: (serviceId, body) => axiosClient.post(`/catalog/packages/services/${serviceId}`, body),
  getPackages: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/packages/services/${serviceId}`, { params: { page, size } }),
  getPackage: (packageId) => axiosClient.get(`/catalog/packages/${packageId}`),
  updatePackage: (packageId, body) => axiosClient.put(`/catalog/packages/${packageId}`, body),
  deletePackage: (packageId) => axiosClient.delete(`/catalog/packages/${packageId}`),

  // Add-ons
  createAddon: (serviceId, body) => axiosClient.post(`/catalog/addons/service/${serviceId}`, body),
  getAddons: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/addons/service/${serviceId}`, { params: { page, size } }),
  getAddon: (addonId) => axiosClient.get(`/catalog/addons/${addonId}`),
  updateAddon: (addonId, body) => axiosClient.put(`/catalog/addons/${addonId}`, body),
  deleteAddon: (addonId) => axiosClient.delete(`/catalog/addons/${addonId}`),

  // Service Media
  uploadMedia: (serviceId, file, cover = false) => {
    const body = new FormData();
    body.append('file', file);
    return axiosClient.post(`/catalog/medias/services/${serviceId}/upload`, body, { params: { cover } });
  },
  createMedia: (serviceId, body) => axiosClient.post(`/catalog/medias/services/${serviceId}`, body),
  getMedias: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/medias/services/${serviceId}`, { params: { page, size } }),
  getMedia: (serviceMediaId) => axiosClient.get(`/catalog/medias/${serviceMediaId}`),
  updateMedia: (serviceMediaId, body) => axiosClient.put(`/catalog/medias/${serviceMediaId}`, body),
  deleteMedia: async (serviceMediaId) => {
    try {
      return await axiosClient.delete(`/catalog/medias/${serviceMediaId}`);
    } catch (err) {
      if (err?.status !== 404 || Number(err.code) !== 1016) throw err;
    }
  },
};

// catalog-service codes for rules, slots, service status and ownership.
const CATALOG_MESSAGES = {
  1017: 'Giờ kết thúc phải sau giờ bắt đầu.',
  1021: 'Khung giờ này không còn trống. Vui lòng chọn khung giờ khác.',
  1022: 'Khung giờ này đã qua.',
  1024: 'Khung giờ vừa có người đặt. Vui lòng chọn lại.',
  1025: 'Bạn không phải chủ dịch vụ này.',
  1026: 'Trạng thái dịch vụ không hợp lệ.',
  1027: 'Thời lượng mỗi lượt phải lớn hơn 0.',
  1028: 'Ngày trong tuần không hợp lệ.',
};

export const catalogErrorMessage = (err) =>
  (err?.code !== undefined && CATALOG_MESSAGES[err.code]) || err?.message || 'Không lưu được thay đổi. Vui lòng thử lại.';

export const isStoredCatalogMedia = (url) => /^\/medias\/[^/]+\/content$/.test(url);
export const catalogMediaUrl = (url) => isStoredCatalogMedia(url) ? `/api/v1/catalog${url}` : url;

// 403 also means "not the owner of this service" (1025); only a missing
// role (1007, or no code) means the account is not a provider yet.
export const isNotProvider = (err) =>
  err?.status === 403 && (err.code === undefined || FORBIDDEN_CODES.includes(err.code));

export default catalogApi;
