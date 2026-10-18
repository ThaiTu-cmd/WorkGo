// MOCK MODE — backend chưa xong. Muốn live: git checkout <file> từ HEAD cũ.

const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

const axiosClient = {
  get: async (url, config) => {
    void url;
    void config;
    await delay(80);
    return { result: { data: [] } };
  },
  post: async (url, data, config) => {
    void url;
    void data;
    void config;
    await delay(80);
    return { result: { token: `mock-token-${Date.now()}` } };
  },
};

export default axiosClient;
