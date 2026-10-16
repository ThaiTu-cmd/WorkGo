// MOCK MODE — backend chưa xong. Muốn live: git checkout <file> từ HEAD cũ.
import { mockCategories } from '../data/mockCategories';

const delay = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const catalogApi = {
  getRootCategories: async (page = 0, size = 12) => {
    await delay(80);
    const startIndex = page * size;
    const data = mockCategories.slice(startIndex, startIndex + size);
    return {
      result: {
        data: data.map((cat) => ({
          categoryId: cat.categoryId,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          children: (cat.popularTags || []).map((t) => ({ name: t })),
        })),
      },
    };
  },

  getCategoryById: async (categoryId) => {
    await delay(60);
    const found = mockCategories.find((c) => c.categoryId === categoryId);
    return {
      result: {
        data: found
          ? {
              categoryId: found.categoryId,
              name: found.name,
              slug: found.slug,
              description: found.description,
              children: (found.popularTags || []).map((t) => ({ name: t })),
            }
          : null,
      },
    };
  },
};

export default catalogApi;
