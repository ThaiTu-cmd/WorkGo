import type { ReviewFormData } from "../schemas/review";
import type { ReportFormData } from "../schemas/dispute";

export interface DisputeTimelineItem {
  status: string;
  title: string;
  timestamp: string;
  note: string;
}

export interface DisputeItem {
  disputeId: string;
  orderId: string;
  orderNumber: string;
  serviceTitle: string;
  amount: number;
  reason: string;
  description: string;
  timeline: DisputeTimelineItem[];
  resolution: string;
  evidence: string[];
}

const liveDisputes = new Map<string, DisputeItem>([
  [
    "disp-441",
    {
      disputeId: "disp-441",
      orderId: "ord-8812",
      orderNumber: "WG-ORD-8812",
      serviceTitle: "Thiết kế Logo & Bộ nhận diện thương hiệu công ty",
      amount: 6000000,
      reason: "Sản phẩm giao không đúng yêu cầu ban đầu và trễ hẹn 4 ngày",
      description:
        "Đối tác cam kết bàn giao trong 3 ngày nhưng kéo dài sang ngày thứ 7 mới gửi bản nháp không đúng phong cách đã thống nhất. Sau khi yêu cầu chỉnh sửa, đối tác không phản hồi tin nhắn.",
      timeline: [
        {
          status: "OPEN",
          title: "Đã gửi khiếu nại",
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          note: "Khách hàng mở khiếu nại yêu cầu hoàn tiền 50% tiền cọc.",
        },
        {
          status: "UNDER_REVIEW",
          title: "Ban quản trị đang xem xét",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          note: "Admin WorkGo đã tiếp nhận bằng chứng và yêu cầu 2 bên phản hồi.",
        },
      ],
      resolution:
        "Khiếu nại đang được đội ngũ giải quyết tranh chấp thụ lý. Kết quả phán quyết sẽ được thông báo trong vòng 24 giờ làm việc.",
      evidence: ["screenshot_chat_log.png", "figma_revision_history.pdf"],
    },
  ],
]);

const reviewedOrders = new Set<string>();

export const trustApi = {
  async submitReview(orderId: string, data: ReviewFormData) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    reviewedOrders.add(orderId);
    return {
      reviewId: `rev-${Date.now()}`,
      orderId,
      rating: data.rating,
      comment: data.comment || "",
      createdAt: new Date().toISOString(),
    };
  },

  async hasReviewed(orderId: string) {
    return reviewedOrders.has(orderId);
  },

  async getDispute(disputeId: string): Promise<DisputeItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const existing = liveDisputes.get(disputeId);
    if (existing) return existing;

    const fallback: DisputeItem = {
      disputeId,
      orderId: "ord-default",
      orderNumber: "WG-ORD-DEFAULT",
      serviceTitle: "Dịch vụ giải quyết tranh chấp",
      amount: 1000000,
      reason: "Yêu cầu hòa giải tranh chấp",
      description: "Hệ thống đang xử lý yêu cầu khiếu nại của bạn.",
      timeline: [
        {
          status: "OPEN",
          title: "Đã tiếp nhận yêu cầu",
          timestamp: new Date().toISOString(),
          note: "Hệ thống đã ghi nhận yêu cầu hỗ trợ tranh chấp.",
        },
      ],
      resolution: "Đang được chuyên viên thụ lý.",
      evidence: [],
    };
    liveDisputes.set(disputeId, fallback);
    return fallback;
  },

  async submitReport(data: ReportFormData) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      reportId: `rep-${Date.now()}`,
      ...data,
      status: "RECEIVED",
      createdAt: new Date().toISOString(),
    };
  },
};
