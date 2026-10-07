// BLOCKED BY BACKEND: Orders endpoints are not yet implemented in backend (xlsx 66-79, assigned to Thien)

import { MOCK_ORDER } from "../mocks/fixtures";

export const ordersApi = {
  async getOrder(orderId: string) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      ...MOCK_ORDER,
      orderId,
    };
  },
};
