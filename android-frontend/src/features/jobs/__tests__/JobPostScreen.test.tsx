import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { jobApi, type JobDetailDto } from '@/api/jobApi';

import { JobPostScreen } from '../JobPostScreen';

jest.mock('@/api/jobApi', () => ({
  jobApi: {
    createJob: jest.fn(),
  },
}));

jest.mock('@/api/catalogApi', () => ({
  catalogApi: {
    getRootCategories: jest.fn().mockResolvedValue({
      result: {
        data: [
          { categoryId: 'cat-1', name: 'Thiết kế' },
          { categoryId: 'cat-2', name: 'Sửa chữa' },
        ],
      },
    }),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

const mockJobDetail: JobDetailDto = {
  jobId: 'job-new',
  clientId: 'client-1',
  categoryId: 'cat-1',
  title: 'Thiết kế bao bì đóng gói nông sản chất lượng cao',
  description: 'Cần thiết kế nhãn dán, túi giấy và hộp carton cho 3 dòng sản phẩm.',
  budgetMin: 3000000,
  budgetMax: 5000000,
  currency: 'VND',
  executionType: 'DIGITAL',
  status: 'OPEN',
  createdAt: '2026-11-01T00:00:00Z',
};

describe('JobPostScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays checklist and creates job when valid', async () => {
    (jobApi.createJob as jest.Mock).mockResolvedValue({
      result: mockJobDetail,
    });
    const onSuccess = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <JobPostScreen onSuccess={onSuccess} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Đăng Việc Làm Mới')).toBeTruthy();
      expect(screen.getByText('Tiêu chuẩn đăng việc')).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByPlaceholderText('Ví dụ: Thiết kế bộ logo nhận diện thương hiệu'),
      'Thiết kế bao bì đóng gói nông sản chất lượng cao'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Mô tả cụ thể yêu cầu công việc, phạm vi bàn giao...'),
      'Cần thiết kế nhãn dán, túi giấy và hộp carton cho 3 dòng sản phẩm.'
    );
    fireEvent.changeText(screen.getByPlaceholderText('2500000'), '3000000');

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Đăng Tin Việc Làm' });
      expect(btn.props.accessibilityState.disabled).toBe(false);
    });

    fireEvent.press(screen.getByRole('button', { name: 'Đăng Tin Việc Làm' }));

    await waitFor(() => {
      expect(jobApi.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Thiết kế bao bì đóng gói nông sản chất lượng cao',
          budgetMin: 3000000,
        })
      );
      expect(onSuccess).toHaveBeenCalledWith('job-new');
    });
  });
});
