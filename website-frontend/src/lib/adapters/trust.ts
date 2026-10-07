// BLOCKED BY BACKEND: Reviews, Disputes, and Reports endpoints are not yet implemented in backend (xlsx 115-124)

import { MOCK_DISPUTE } from "../mocks/fixtures";
import type { ReviewFormData } from "../schemas/review";
import type { ReportFormData } from "../schemas/dispute";

const reviewedOrders = new Set<string>();

export const trustApi = {
  async submitReview(orderId: string, data: ReviewFormData) {
    await new Promise((resolve) => setTimeout(resolve, 300));
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

  async getDispute(disputeId: string) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      ...MOCK_DISPUTE,
      disputeId,
    };
  },

  async submitReport(data: ReportFormData) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      reportId: `rep-${Date.now()}`,
      ...data,
      status: "RECEIVED",
      createdAt: new Date().toISOString(),
    };
  },
};
