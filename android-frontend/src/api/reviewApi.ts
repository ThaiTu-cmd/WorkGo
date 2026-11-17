import { http } from './client';
import type { ApiResponse, OrderReviewStatusDto, PageResponse, RatingSummaryDto, ReviewDirection, ReviewDto, ReviewSubmitReq } from './types';

// trust-service endpoints via gateway (/api/v1/trust/**).
export const reviewApi = {
  submitReview: (body: ReviewSubmitReq) =>
    http.post<ApiResponse<ReviewDto>>('/trust/reviews', body),

  getServiceReviews: (serviceId: string, page = 0, size = 20) =>
    http.get<ApiResponse<RatingSummaryDto>>(`/trust/services/${serviceId}/reviews`, { params: { page, size } }),

  getProviderReviews: (providerId: string, page = 0, size = 20) =>
    http.get<ApiResponse<RatingSummaryDto>>(`/trust/providers/${providerId}/reviews`, { params: { page, size } }),

  getOrderReviewStatus: (orderId: string) =>
    http.get<ApiResponse<OrderReviewStatusDto>>(`/trust/reviews/orders/${orderId}`),

  getMyReviews: (direction?: ReviewDirection, page = 0, size = 20) =>
    http.get<ApiResponse<PageResponse<ReviewDto>>>('/trust/reviews/my-reviews', { params: { direction, page, size } }),
};
