import axiosClient from './axiosClient';

// catalog-service via gateway: /api/v1/catalog/** (requires a Bearer token).
export const catalogApi = {
  getRootCategories: (page = 0, size = 50) =>
    axiosClient.get('/catalog/categories/roots', { params: { page, size } }),

  getCategoryById: (categoryId) => axiosClient.get(`/catalog/categories/${categoryId}`),

  getChildCategories: (parentId, page = 0, size = 50) =>
    axiosClient.get(`/catalog/categories/${parentId}/children`, { params: { page, size } }),
};

export default catalogApi;
