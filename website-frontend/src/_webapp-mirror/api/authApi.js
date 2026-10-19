import axiosClient, { getAccessToken, setAccessToken } from './axiosClient';

export { splitFullName, joinFullName } from './adapters';

// identity-service via gateway (/api/v1/identity/**). token/registration/logout are public.
export const authApi = {
  login: async (userName, password) => {
    const res = await axiosClient.post('/identity/auth/token', { userName, password });
    const token = res?.result?.token;
    if (!token) throw new Error('Không nhận được token từ máy chủ.');
    setAccessToken(token);
    return token;
  },

  // body: { firstName, lastName, userName, password, email, phone }
  register: (body) => axiosClient.post('/identity/users/registration', body),

  logout: async () => {
    const token = getAccessToken();
    setAccessToken(null);
    if (!token) return;
    try {
      await axiosClient.post('/identity/auth/logout', { token });
    } catch {
      // token already dropped locally; server-side invalidation is best effort
    }
  },

  getMyInfo: () => axiosClient.get('/identity/users/myInfo'),

  updateUser: (userId, body) => axiosClient.put(`/identity/users/${userId}`, body),
};

export default authApi;
