import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { jobApi, type JobDetailDto } from '@/api/jobApi';

import { JobDetailScreen } from '../JobDetailScreen';

let mockAuthUser = { sub: 'provider-1' };

jest.mock('@/api/jobApi', () => ({
  jobApi: {
    getJob: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'job-1' }),
}));

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', claims: mockAuthUser }),
}));

const mockJobDetail: JobDetailDto = {
  jobId: 'job-1',
  clientId: 'client-1',
  categoryId: 'cat-1',
  title: 'Thiết kế nhận diện thương hiệu quán cafe',
  description: 'Cần thiết kế bộ logo và bảng hiệu chi tiết trong 5 ngày làm việc.',
  budgetMin: 2000000,
  budgetMax: 3000000,
  currency: 'VND',
  executionType: 'DIGITAL',
  status: 'OPEN',
  createdAt: '2026-11-01T00:00:00Z',
  client: { userId: 'client-1', fullName: 'Nguyễn Văn Khách' },
};

describe('JobDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUser = { sub: 'provider-1' };
  });

  test('renders job detail and supports submit proposal action for providers', async () => {
    (jobApi.getJob as jest.Mock).mockResolvedValue({ result: mockJobDetail });
    const onSubmitProposal = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <JobDetailScreen jobId="job-1" onSubmitProposal={onSubmitProposal} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Thiết kế nhận diện thương hiệu quán cafe')).toBeTruthy();
      expect(screen.getByText('Cần thiết kế bộ logo và bảng hiệu chi tiết trong 5 ngày làm việc.')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Ứng tuyển / Gửi đề xuất'));
    expect(onSubmitProposal).toHaveBeenCalledWith('job-1');
  });

  test('renders review proposals button when viewer is the job owner', async () => {
    mockAuthUser = { sub: 'client-1' };
    (jobApi.getJob as jest.Mock).mockResolvedValue({ result: mockJobDetail });
    const onReviewProposals = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <JobDetailScreen jobId="job-1" onReviewProposals={onReviewProposals} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Xem các đề xuất đã nhận')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Xem các đề xuất đã nhận'));
    expect(onReviewProposals).toHaveBeenCalledWith('job-1');
  });
});
