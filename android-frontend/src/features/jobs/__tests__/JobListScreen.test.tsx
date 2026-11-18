import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { jobApi, type JobSummaryDto } from '@/api/jobApi';

import { JobListScreen } from '../JobListScreen';

jest.mock('@/api/jobApi', () => ({
  jobApi: {
    searchJobs: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

const mockJobs: JobSummaryDto[] = [
  {
    jobId: 'job-1',
    title: 'Thiết kế nhận diện thương hiệu quán cafe',
    description: 'Cần thiết kế bộ logo và bảng hiệu chi tiết',
    budgetMin: 2000000,
    budgetMax: 3000000,
    currency: 'VND',
    executionType: 'DIGITAL',
    status: 'OPEN',
    applicationCount: 3,
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    jobId: 'job-2',
    title: 'Vệ sinh và bảo dưỡng máy lạnh tại nhà',
    description: 'Vệ sinh 2 máy lạnh Daikin 1.5HP',
    budgetMin: 400000,
    budgetMax: 500000,
    currency: 'VND',
    executionType: 'ONSITE',
    status: 'OPEN',
    applicationCount: 1,
    createdAt: '2026-11-02T00:00:00Z',
  },
];

describe('JobListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders jobs, applies executionType filter, and handles interactions', async () => {
    (jobApi.searchJobs as jest.Mock).mockResolvedValue({
      result: { data: mockJobs, totalPages: 1, totalElements: 2 },
    });

    const onSelectJob = jest.fn();
    const onCreateJob = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <JobListScreen onSelectJob={onSelectJob} onCreateJob={onCreateJob} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Thiết kế nhận diện thương hiệu quán cafe')).toBeTruthy();
      expect(screen.getByText('Vệ sinh và bảo dưỡng máy lạnh tại nhà')).toBeTruthy();
    });

    // Press filter chip
    fireEvent.press(screen.getByRole('button', { name: 'Trực tuyến' }));
    await waitFor(() => {
      expect(jobApi.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({ executionType: 'DIGITAL' })
      );
    });

    // Tap job card
    fireEvent.press(screen.getByLabelText('Thiết kế nhận diện thương hiệu quán cafe'));
    expect(onSelectJob).toHaveBeenCalledWith('job-1');

    // Tap create job
    fireEvent.press(screen.getByRole('button', { name: 'Đăng việc' }));
    expect(onCreateJob).toHaveBeenCalled();
  });
});
