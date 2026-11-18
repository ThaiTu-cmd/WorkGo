import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { jobApi, type ProposalDto } from '@/api/jobApi';

import { ProposalReviewScreen } from '../ProposalReviewScreen';

jest.mock('@/api/jobApi', () => ({
  jobApi: {
    getJobProposals: jest.fn(),
    acceptProposal: jest.fn(),
    rejectProposal: jest.fn(),
    orderSync: jest.fn(),
    retryOrder: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'job-1' }),
}));

const mockProposals: ProposalDto[] = [
  {
    proposalId: 'prop-1',
    jobId: 'job-1',
    price: 2500000,
    currency: 'VND',
    estimatedDays: 4,
    message: 'Tôi có kinh nghiệm 5 năm thiết kế F&B',
    terms: 'Bảo hành chỉnh sửa 3 lần',
    status: 'PENDING',
    createdAt: '2026-11-03T00:00:00Z',
    provider: {
      providerProfileId: 'prov-1',
      businessName: 'Studio Sáng Tạo',
      ratingAvg: 4.9,
      ratingCount: 12,
    },
  },
];

describe('ProposalReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders proposals and supports accept with lock', async () => {
    (jobApi.getJobProposals as jest.Mock).mockResolvedValue({
      result: { data: mockProposals, totalPages: 1 },
    });
    (jobApi.acceptProposal as jest.Mock).mockResolvedValue({
      result: { proposal: mockProposals[0], status: 'SUCCESS', orderId: 'ord-123' },
    });
    (jobApi.orderSync as jest.Mock).mockResolvedValue({
      result: { proposal: mockProposals[0], status: 'SUCCESS', orderId: 'ord-123' },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <ProposalReviewScreen jobId="job-1" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Studio Sáng Tạo')).toBeTruthy();
      expect(screen.getByText(/2\.500\.000/)).toBeTruthy();
    });

    fireEvent.press(screen.getByRole('button', { name: 'Chấp nhận' }));

    await waitFor(() => {
      expect(jobApi.acceptProposal).toHaveBeenCalledWith('prop-1');
      expect(jobApi.orderSync).toHaveBeenCalledWith('prop-1');
    });
  });
});
