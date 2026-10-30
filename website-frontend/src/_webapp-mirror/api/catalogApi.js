import axiosClient from './axiosClient.js';

// catalog-service via gateway: /api/v1/catalog/** (requires a Bearer token).
export const catalogApi = {
  getRootCategories: (page = 0, size = 50) =>
    axiosClient.get('/catalog/categories/roots', { params: { page, size } }),

  getCategoryById: (categoryId) => axiosClient.get(`/catalog/categories/${categoryId}`),

  getChildCategories: (parentId, page = 0, size = 50) =>
    axiosClient.get(`/catalog/categories/${parentId}/children`, { params: { page, size } }),

  getService: (serviceId) => axiosClient.get(`/catalog/services/${serviceId}`),

  // PUBLISHED services. The current endpoint only matches when categoryId,
  // executionType, minPrice and maxPrice are ALL present (see useServiceList).
  listServices: ({ categoryId, executionType, minPrice, maxPrice, page = 0, size = 50 } = {}) => {
    const params = { page, size };
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

  // status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED'. The update mapper
  // writes nulls too, so re-send the whole record with the new status.
  setServiceStatus: async (serviceId, status) => {
    const current = (await axiosClient.get(`/catalog/services/${serviceId}`))?.result;
    if (!current) throw new Error('Không tìm thấy dịch vụ');
    return axiosClient.put(`/catalog/services/${serviceId}`, {
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
  createMedia: (serviceId, body) => axiosClient.post(`/catalog/medias/services/${serviceId}`, body),
  getMedias: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/medias/services/${serviceId}`, { params: { page, size } }),
  getMedia: (serviceMediaId) => axiosClient.get(`/catalog/medias/${serviceMediaId}`),
  updateMedia: (serviceMediaId, body) => axiosClient.put(`/catalog/medias/${serviceMediaId}`, body),
  deleteMedia: (serviceMediaId) => axiosClient.delete(`/catalog/medias/${serviceMediaId}`),
};

export default catalogApi;
