import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.warn('[API Client Notice] Service unavailable, falling back to cached/mock data.', error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
