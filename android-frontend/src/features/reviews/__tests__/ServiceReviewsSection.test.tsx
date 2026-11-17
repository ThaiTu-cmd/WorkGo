import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { reviewApi } from '@/api/reviewApi';
import { ServiceReviewsSection } from '../ServiceReviewsSection';

jest.mock('@/api/reviewApi', () => ({
  reviewApi: {
    getServiceReviews: jest.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('renders empty message when no reviews', async () => {
  (reviewApi.getServiceReviews as jest.Mock).mockResolvedValueOnce({
    result: {
      ratingAvg: 0,
      ratingCount: 0,
      reviews: { data: [] },
    },
  });

  await renderWithClient(<ServiceReviewsSection serviceId="s1" />);

  expect(await screen.findByText('Chưa có đánh giá nào.')).toBeTruthy();
  expect(screen.getByText('Đánh giá từ khách hàng')).toBeTruthy();
});

test('renders list of reviews and rating average', async () => {
  (reviewApi.getServiceReviews as jest.Mock).mockResolvedValueOnce({
    result: {
      ratingAvg: 4.8,
      ratingCount: 15,
      reviews: {
        data: [
          {
            reviewId: 'r1',
            rating: 5,
            comment: 'Làm việc rất cẩn thận và nhiệt tình.',
            reviewerId: 'u12345678',
            createdAt: '2026-11-15T10:00:00Z',
          },
        ],
      },
    },
  });

  await renderWithClient(<ServiceReviewsSection serviceId="s1" />);

  expect(await screen.findByText('4.8 (15)')).toBeTruthy();
  expect(screen.getByText('Làm việc rất cẩn thận và nhiệt tình.')).toBeTruthy();
});
