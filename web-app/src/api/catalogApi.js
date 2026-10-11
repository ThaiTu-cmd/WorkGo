import axiosClient from './axiosClient';

export const catalogApi = {
  getRootCategories: async (page = 0, size = 12) => {
    try {
      const response = await axiosClient.get('/catalog/categories/roots', {
        params: { page, size }
      });
      return response;
    } catch (error) {
      return null;
    }
  },

  getCategoryById: async (categoryId) => {
    try {
      const response = await axiosClient.get(`/catalog/categories/${categoryId}`);
      return response;
    } catch (error) {
      return null;
    }
  }
};

export default catalogApi;
