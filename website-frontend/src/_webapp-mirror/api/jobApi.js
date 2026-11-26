import axiosClient from './axiosClient.js';

// job-service endpoints via gateway (/api/v1/job/**).
export const jobApi = {
  getProposalRewardQuote: (id) => axiosClient.post(`/job/proposals/${encodeURIComponent(id)}/reward-quote`),
  // Public / client job search
  /**
   * @param {{ keyword?: string, categoryId?: string, executionType?: string, minBudget?: number, maxBudget?: number, page?: number, size?: number, sort?: string }} [params]
   */
  searchJobs: ({ keyword, categoryId, executionType, minBudget, maxBudget, page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    axiosClient.get('/job/jobs', {
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

  // Client's posted jobs
  getMyJobs: ({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    axiosClient.get('/job/jobs/my-jobs', { params: { page, size, sort } }),

  // Single job detail
  getJob: (jobId) => axiosClient.get(`/job/jobs/${jobId}`),

  // Create job (ROLE_CLIENT)
  createJob: (body, key) => axiosClient.post('/job/jobs', body, key ? {headers:{'Idempotency-Key':key}} : undefined),
  createDraft: (body, key) => axiosClient.post('/job/jobs/drafts', body, key ? {headers:{'Idempotency-Key':key}} : undefined),
  getCreationReceipt: (key) => axiosClient.get('/job/jobs/receipt',{params:{key}}),
  uploadAttachment: async (id, file) => {
    const form=new FormData();form.append('file',file);
    const response=await axiosClient.post(`/job/jobs/${encodeURIComponent(id)}/attachments`,form);
    if(!response?.result?.id || response.result.status!=='READY')throw new Error('Invalid attachment receipt');
    return response;
  },

  // Update job (ROLE_CLIENT)
  updateJob: (jobId, body) => axiosClient.put(`/job/jobs/${jobId}`, body),

  // Provider application
  applyJob: (jobId, body) => axiosClient.post(`/job/jobs/${jobId}/applications`, body),

  // Job applications (ROLE_CLIENT)
  getJobApplications: (jobId, { page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    axiosClient.get(`/job/jobs/${jobId}/applications`, { params: { page, size, sort } }),

  // Provider's own applications (ROLE_PROVIDER)
  getMyApplications: ({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    axiosClient.get('/job/applications/my-applications', { params: { page, size, sort } }),

  // Submit proposal for an application (ROLE_PROVIDER)
  submitProposal: (applicationId, body) =>
    axiosClient.post(`/job/applications/${applicationId}/proposal`, body),

  // Proposals for a job (ROLE_CLIENT)
  getJobProposals: (jobId, { page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    axiosClient.get(`/job/jobs/${jobId}/proposals`, { params: { page, size, sort } }),

  // Accept a proposal (ROLE_CLIENT) -> triggers order creation in order-service
  acceptProposal: (proposalId) => axiosClient.post(`/job/proposals/${proposalId}/accept`),

  // Reject a proposal (ROLE_CLIENT)
  rejectProposal: (proposalId) => axiosClient.post(`/job/proposals/${proposalId}/reject`),

  // Check sync status with order-service
  orderSync: (proposalId) => axiosClient.get(`/job/proposals/${proposalId}/order-sync`),

  // Retry order creation if sync failed
  retryOrder: (proposalId) => axiosClient.post(`/job/proposals/${proposalId}/order-retry`),
};

export default jobApi;
