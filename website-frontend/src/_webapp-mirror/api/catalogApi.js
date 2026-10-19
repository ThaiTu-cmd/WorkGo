import axiosClient from './axiosClient';

// catalog-service via gateway: /api/v1/catalog/** (requires a Bearer token).
export const catalogApi = {
  getRootCategories: (page = 0, size = 50) =>
    axiosClient.get('/catalog/categories/roots', { params: { page, size } }),

  getCategoryById: (categoryId) => axiosClient.get(`/catalog/categories/${categoryId}`),

  getChildCategories: (parentId, page = 0, size = 50) =>
    axiosClient.get(`/catalog/categories/${parentId}/children`, { params: { page, size } }),

  getService: (serviceId) => axiosClient.get(`/catalog/services/${serviceId}`),

  getMyServices: (page = 0, size = 50) =>
    axiosClient.get('/catalog/services/my-services', { params: { page, size } }),

  // body: { categoryId, executionType, title, slug, description, basePrice, currency }
  createService: (body) => axiosClient.post('/catalog/services', body),

  // body: { categoryId, executionType, title, slug, description, currency }
  updateService: (serviceId, body) => axiosClient.put(`/catalog/services/${serviceId}`, body),

  deleteService: (serviceId) => axiosClient.delete(`/catalog/services/${serviceId}`),

  // body: { name, description, price, currency, deliveryDay, durationMinute, revisionLimit }
  createPackage: (serviceId, body) => axiosClient.post(`/catalog/packages/services/${serviceId}`, body),

  updatePackage: (packageId, body) => axiosClient.put(`/catalog/packages/${packageId}`, body),

  // body: { url, mediaType: 'IMAGE' | 'VIDEO' | 'FILE', cover }
  createMedia: (serviceId, body) => axiosClient.post(`/catalog/medias/services/${serviceId}`, body),

  getPackages: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/packages/services/${serviceId}`, { params: { page, size } }),

  getAddons: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/addons/service/${serviceId}`, { params: { page, size } }),

  getMedias: (serviceId, page = 0, size = 20) =>
    axiosClient.get(`/catalog/medias/services/${serviceId}`, { params: { page, size } }),
};

export default catalogApi;
