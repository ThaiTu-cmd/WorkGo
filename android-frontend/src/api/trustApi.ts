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

export type ProviderScoreReview = {
  reviewId: string; providerId: string; score: number; sourceVersion: number;
  outcome: 'KEEP_RESTRICTED' | 'BAN_PROVIDER'; reason: string; reference: string;
  reviewedAt: string; sanctionId?: string | null;
};
export type ProviderSanction = {
  id: string; providerId: string; scope: 'PROVIDER' | 'ACCOUNT' | 'SECURITY';
  reason: string; reference: string; effectiveAt: string; expiresAt?: string | null; revokedAt?: string | null;
};

function reputationResult(response: ApiResponse<ReputationResponse>, providerId: string) {
  const result = response?.result;
  if (response?.code !== 1000 || result?.providerId !== providerId ||
      !Number.isInteger(result.score) || result.score < 0 || result.score > 100 ||
      result.policyVersion !== 'WG-POLICY-1.0') {
    throw new Error('Invalid reputation contract');
  }
  return response;
}

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

  supplementEvidence: async (disputeId: string, file: {uri:string;name:string;type:string}) => {
    const body=new FormData();body.append('file',file as unknown as Blob);
    const res=await http.post<ApiResponse<{id:string;status:string;createdAt:string}>>(`/trust/disputes/${encodeURIComponent(disputeId)}/evidence`,body);
    if(!res?.result?.id||res.result.status!=='READY')throw new Error('Invalid evidence receipt');return res;
  },
  getEvidence: (id:string) => http.get<ApiResponse<{id:string;originalName:string;createdAt:string}[]>>(`/trust/disputes/${encodeURIComponent(id)}/evidence`),
  getDecisionProgress: (id:string) => http.get<ApiResponse<{decisionId:string;paymentStatus:string;orderStatus:string;timerStatus:string;executionStatus:string}>>(`/trust/disputes/${encodeURIComponent(id)}/decision`),
  getReputationLedger: () => http.get<ApiResponse<{content:{id:string;createdAt:string;kind:string;requestedDelta:number;appliedDelta:number;afterScore:number;orderId:string;reason:string}[]}>>('/trust/reputation/me/ledger'),

  // Reports
  submitReport: (body: ReportReq) =>
    http.post<ApiResponse<ReportDto>>('/trust/reports', body),

  // Reputation & Appeals
  getProviderScoreReviews: async (providerId: string) => {
    const response = await http.get<ApiResponse<ProviderScoreReview[]>>(`/identity/providers/${encodeURIComponent(providerId)}/score-reviews`);
    if (response?.code !== 1000 || !Array.isArray(response.result) || response.result.some(row =>
      row.providerId !== providerId || !row.reviewId || !Number.isInteger(row.score) || row.score < 0 || row.score > 4
      || !Number.isSafeInteger(row.sourceVersion) || row.sourceVersion < 0
      || !['KEEP_RESTRICTED', 'BAN_PROVIDER'].includes(row.outcome) || !row.reason || !row.reference
      || !Number.isFinite(Date.parse(row.reviewedAt)) || row.outcome === 'BAN_PROVIDER' && !row.sanctionId)) {
      throw new Error('Lịch sử xét điểm không hợp lệ.');
    }
    return response;
  },
  getProviderSanctions: async (providerId: string) => {
    const response = await http.get<ApiResponse<ProviderSanction[]>>(`/identity/providers/${encodeURIComponent(providerId)}/sanctions`);
    if (response?.code !== 1000 || !Array.isArray(response.result) || response.result.some(row =>
      row.providerId !== providerId || !row.id || !['PROVIDER', 'ACCOUNT', 'SECURITY'].includes(row.scope)
      || !Number.isFinite(Date.parse(row.effectiveAt)) || row.expiresAt != null && !Number.isFinite(Date.parse(row.expiresAt))
      || row.revokedAt != null && !Number.isFinite(Date.parse(row.revokedAt)))) throw new Error('Dữ liệu chế tài không hợp lệ.');
    return response;
  },
  getProviderReputation: (providerId: string) =>
    http.get<ApiResponse<ReputationResponse>>(`/trust/providers/${encodeURIComponent(providerId)}/reputation`)
      .then(response => reputationResult(response, providerId)),

  submitAppeal: async (body: AppealReq) => {
    if(!body.sanctionId)throw new Error('Select a sanction');
    const res=await http.post<ApiResponse<AppealResponse & {id:string}>>(`/identity/sanctions/${encodeURIComponent(body.sanctionId)}/appeals`,{explanation:[body.reason,body.explanation].filter(Boolean).join('\n')});
    if(!res?.result?.id)throw new Error('Invalid appeal receipt');return {...res,result:{...res.result,appealId:res.result.id}};
  },
};

export default trustApi;
