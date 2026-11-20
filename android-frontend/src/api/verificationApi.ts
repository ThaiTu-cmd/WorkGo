import { http } from './client';
import type { ApiResponse } from './types';

export type VerificationSubmitBody = {
  verificationType: 'IDENTITY' | 'IDENTITY_CARD' | 'BUSINESS';
  documentType: string;
};

export const verificationApi = {
  submit: (body: VerificationSubmitBody) =>
    http.post<ApiResponse<unknown>>('/identity/provider-verifications', body),

  getMy: (page = 0, size = 10) =>
    http.get<ApiResponse<unknown>>(`/identity/provider-verifications/my?page=${page}&size=${size}`),
};
