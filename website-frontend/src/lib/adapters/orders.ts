export interface OrderItem {
  orderId: string;
  orderNumber: string;
  serviceTitle: string;
  providerName: string;
  amount: number;
  status: "PENDING" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  completedAt?: string;
  createdAt?: string;
}

const liveOrders = new Map<string, OrderItem>([
  [
    "ord-8812",
    {
      orderId: "ord-8812",
      orderNumber: "WG-ORD-8812",
      serviceTitle: "Thiết kế Logo & Bộ nhận diện thương hiệu công ty",
      providerName: "Nguyễn Văn Hùng",
      amount: 6000000,
      status: "COMPLETED",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
]);

export const ordersApi = {
  async getOrder(orderId: string): Promise<OrderItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const existing = liveOrders.get(orderId);
    if (existing) return existing;

    const newOrder: OrderItem = {
      orderId,
      orderNumber: `WG-ORD-${orderId.slice(-4).toUpperCase()}`,
      serviceTitle: "Dịch vụ chuyên nghiệp WorkGo",
      providerName: "Đối tác chuyên môn",
      amount: 5000000,
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    };
    liveOrders.set(orderId, newOrder);
    return newOrder;
  },

  createOrder(
    data: Partial<OrderItem> & {
      serviceTitle: string;
      providerName: string;
      amount: number;
    }
  ): OrderItem {
    const id = `ord-${Date.now()}`;
    const order: OrderItem = {
      orderId: id,
      orderNumber: `WG-ORD-${Date.now().toString().slice(-6)}`,
      serviceTitle: data.serviceTitle,
      providerName: data.providerName,
      amount: data.amount,
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    };
    liveOrders.set(id, order);
    return order;
  },
};
