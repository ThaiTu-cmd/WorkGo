import { http } from './client';
import type { ApiResponse, Paged } from './types';

export type JobExecutionType = 'DIGITAL' | 'ONSITE' | 'DELIVERY' | 'APPOINTMENT';

export type JobStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED';

export type JobAttachmentDto = {
  attachmentId?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
};

export type JobSummaryDto = {
  jobId: string;
  clientId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  executionType: JobExecutionType;
  status?: JobStatus | string;
  deadlineAt?: string;
  createdAt?: string;
  applicationCount?: number;
};

export type JobDetailDto = {
  jobId: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  executionType: JobExecutionType;
  locationSnapshot?: string;
  deadlineAt?: string;
  status: JobStatus | string;
  createdAt: string;
  updatedAt?: string;
  attachments?: JobAttachmentDto[];
  client?: {
    userId: string;
    fullName?: string;
    avatarUrl?: string;
  };
};

export type JobCreateRequest = {
  title: string;
  description: string;
  categoryId: string;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  executionType: JobExecutionType;
  locationSnapshot?: string;
  deadlineAt?: string;
  attachments?: JobAttachmentDto[];
};

export type ApplicationDto = {
  applicationId: string;
  jobId: string;
  providerId: string;
  status: string;
  message?: string;
  createdAt: string;
};

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type ProposalDto = {
  proposalId: string;
  jobId: string;
  applicationId?: string;
  providerId?: string;
  price: number;
  currency?: string;
  estimatedDays: number;
  message: string;
  terms?: string;
  status: ProposalStatus | string;
  createdAt: string;
  expiresAt?: string;
  provider?: {
    providerProfileId?: string;
    businessName?: string;
    avatarUrl?: string;
    ratingAvg?: number;
    ratingCount?: number;
  };
};

export type ProposalSubmitRequest = {
  price: number;
  estimatedDays: number;
  message: string;
  terms?: string;
  expiresAt?: string;
};

export type OrderSyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRY';

export type ProposalAcceptanceDto = {
  proposal: ProposalDto;
  status: OrderSyncStatus;
  orderSyncStatus?: OrderSyncStatus;
  orderId?: string;
};

export type JobSearchParams = {
  keyword?: string;
  categoryId?: string;
  executionType?: JobExecutionType | 'ALL';
  minBudget?: number;
  maxBudget?: number;
  page?: number;
  size?: number;
  sort?: string;
};

// job-service endpoints via gateway (/api/v1/job/**)
export const jobApi = {
  searchJobs: ({ keyword, categoryId, executionType, minBudget, maxBudget, page = 0, size = 20, sort = 'createdAt,desc' }: JobSearchParams = {}) =>
    http.get<Paged<JobSummaryDto>>('/job/jobs', {
      params: {
        ...(keyword && { keyword }),
        ...(categoryId && { categoryId }),
        ...(executionType && executionType !== 'ALL' && { executionType }),
        ...(minBudget !== undefined && { minBudget }),
        ...(maxBudget !== undefined && { maxBudget }),
        page,
        size,
        sort,
      },
    }),

  getMyJobs: ({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    http.get<Paged<JobSummaryDto>>('/job/jobs/my-jobs', { params: { page, size, sort } }),

  getJob: (jobId: string) => http.get<ApiResponse<JobDetailDto>>(`/job/jobs/${jobId}`),

  createJob: (body: JobCreateRequest) => http.post<ApiResponse<JobDetailDto>>('/job/jobs', body),

  updateJob: (jobId: string, body: Partial<JobCreateRequest>) => http.put<ApiResponse<JobDetailDto>>(`/job/jobs/${jobId}`, body),

  applyJob: (jobId: string, body: { message?: string } = {}) =>
    http.post<ApiResponse<ApplicationDto>>(`/job/jobs/${jobId}/applications`, body),

  getJobApplications: (jobId: string, { page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    http.get<Paged<ApplicationDto>>(`/job/jobs/${jobId}/applications`, { params: { page, size, sort } }),

  getMyApplications: ({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    http.get<Paged<ApplicationDto>>('/job/applications/my-applications', { params: { page, size, sort } }),

  submitProposal: (applicationId: string, body: ProposalSubmitRequest) =>
    http.post<ApiResponse<ProposalDto>>(`/job/applications/${applicationId}/proposal`, body),

  getJobProposals: (jobId: string, { page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    http.get<Paged<ProposalDto>>(`/job/jobs/${jobId}/proposals`, { params: { page, size, sort } }),

  acceptProposal: (proposalId: string) =>
    http.post<ApiResponse<ProposalAcceptanceDto>>(`/job/proposals/${proposalId}/accept`),

  rejectProposal: (proposalId: string) =>
    http.post<ApiResponse<ProposalDto>>(`/job/proposals/${proposalId}/reject`),

  orderSync: (proposalId: string) =>
    http.get<ApiResponse<ProposalAcceptanceDto>>(`/job/proposals/${proposalId}/order-sync`),

  retryOrder: (proposalId: string) =>
    http.post<ApiResponse<ProposalAcceptanceDto>>(`/job/proposals/${proposalId}/order-retry`),
};
