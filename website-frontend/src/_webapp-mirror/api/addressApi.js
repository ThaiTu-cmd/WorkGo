import axiosClient from './axiosClient';

// identity-service addresses via gateway (/api/v1/identity/addresses/**).
export const addressApi = {
  getMy: (page = 0, size = 50) =>
    axiosClient.get('/identity/addresses/my', { params: { page, size } }),
  create: (body) => axiosClient.post('/identity/addresses', body),
  update: (addressId, body) => axiosClient.put(`/identity/addresses/${addressId}`, body),
  remove: (addressId) => axiosClient.delete(`/identity/addresses/${addressId}`),
};

export default addressApi;
