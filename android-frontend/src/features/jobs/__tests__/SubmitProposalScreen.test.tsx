import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { jobApi } from '@/api/jobApi';
import { paymentApi } from '@/api/paymentApi';
import { providerApi } from '@/api/providerApi';

import { SubmitProposalScreen } from '../SubmitProposalScreen';

jest.mock('@/api/jobApi', () => ({
  jobApi: {
    applyJob: jest.fn(),
    submitProposal: jest.fn(),
    getMyApplications: jest.fn(),
  },
}));

jest.mock('@/api/paymentApi', () => ({
  paymentApi: {
    getWallet: jest.fn(),
  },
}));

jest.mock('@/api/providerApi', () => ({
  providerApi: {
    getMyProfile: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'job-1' }),
}));

describe('SubmitProposalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks when provider has wallet debt', async () => {
    (paymentApi.getWallet as jest.Mock).mockResolvedValue({
      result: { balance: 0, outstandingFee: 150000, mayStartNewWork: false, currency: 'VND' },
    });
    (providerApi.getMyProfile as jest.Mock).mockResolvedValue({
      result: { verificationStatus: 'VERIFIED' },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <SubmitProposalScreen jobId="job-1" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cảnh báo nợ ví/)).toBeTruthy();
    });
  });

  test('submits proposal when guards pass', async () => {
    (paymentApi.getWallet as jest.Mock).mockResolvedValue({
      result: { balance: 500000, outstandingFee: 0, mayStartNewWork: true, currency: 'VND' },
    });
    (providerApi.getMyProfile as jest.Mock).mockResolvedValue({
      result: { verificationStatus: 'VERIFIED' },
    });
    (jobApi.applyJob as jest.Mock).mockResolvedValue({
      result: { applicationId: 'app-1' },
    });
    (jobApi.submitProposal as jest.Mock).mockResolvedValue({
      result: { proposalId: 'prop-new' },
    });

    const onSuccess = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <SubmitProposalScreen jobId="job-1" onSuccess={onSuccess} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Gửi Đề Xuất & Báo Giá')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: 2000000'), '2200000');
    fireEvent.changeText(screen.getByPlaceholderText('Ví dụ: 3'), '4');
    fireEvent.changeText(
      screen.getByPlaceholderText('Giới thiệu kinh nghiệm, phương án triển khai...'),
      'Tôi cam kết bàn giao đúng tiến độ và đầy đủ bản vẽ vector chất lượng cao.'
    );

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Gửi Báo Giá & Đề Xuất' });
      expect(btn.props.accessibilityState.disabled).toBe(false);
    });

    fireEvent.press(screen.getByRole('button', { name: 'Gửi Báo Giá & Đề Xuất' }));

    await waitFor(() => {
      expect(jobApi.applyJob).toHaveBeenCalledWith('job-1', expect.anything());
      expect(jobApi.submitProposal).toHaveBeenCalledWith('app-1', expect.objectContaining({
        price: 2200000,
        estimatedDays: 4,
      }));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
