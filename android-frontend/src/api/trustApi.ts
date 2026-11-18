import { http } from './client';
import type {
  AppealReq,
  AppealResponse,
  ApiResponse,
  DisputeCreateReq,
  DisputeDto,
  PageResponse,
  ReportDto,
  ReportReq,
  ReputationResponse,
  ReviewDirection,
  ReviewDto,
  ReviewSubmitReq,
} from './types';

// trust-service endpoints via gateway (/api/v1/trust/**)
export const trustApi = {
  // Reviews
  submitReview: (body: ReviewSubmitReq) =>
    http.post<ApiResponse<ReviewDto>>('/trust/reviews', body),

  getMyReviews: (direction?: ReviewDirection, page = 0, size = 20) =>
    http.get<ApiResponse<PageResponse<ReviewDto>>>('/trust/reviews/my-reviews', {
      params: { direction, page, size },
    }),

  // Disputes
  createDispute: (body: DisputeCreateReq) =>
    http.post<ApiResponse<DisputeDto>>('/trust/disputes', body),

  getDispute: (disputeId: string) =>
    http.get<ApiResponse<DisputeDto>>(`/trust/disputes/${disputeId}`),

  getMyDisputes: (status?: string, page = 0, size = 20) =>
    http.get<ApiResponse<PageResponse<DisputeDto>>>('/trust/disputes/my-disputes', {
      params: { ...(status && status !== 'ALL' && { status }), page, size },
    }),

  cancelDispute: (disputeId: string, body?: { reason?: string }) =>
    http.post<ApiResponse<DisputeDto>>(`/trust/disputes/${disputeId}/cancel`, body),

  supplementEvidence: (disputeId: string, body: { evidenceUrl?: string; note?: string }) =>
    http.post<ApiResponse<{ disputeId: string; evidenceUrl?: string; note?: string }>>(
      `/trust/disputes/${disputeId}/evidence`,
      body
    ),

  // Reports
  submitReport: (body: ReportReq) =>
    http.post<ApiResponse<ReportDto>>('/trust/reports', body),

  // Reputation & Appeals
  getProviderReputation: (providerId: string) =>
    http.get<ApiResponse<ReputationResponse>>(`/trust/reputation/${providerId}`),

  submitAppeal: (body: AppealReq) =>
    http.post<ApiResponse<AppealResponse>>('/trust/sanctions/appeal', body),
};

export default trustApi;
