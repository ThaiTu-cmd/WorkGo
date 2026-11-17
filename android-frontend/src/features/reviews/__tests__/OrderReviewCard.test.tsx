import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { reviewApi } from '@/api/reviewApi';
import { OrderReviewCard } from '../OrderReviewCard';

jest.mock('@/api/reviewApi', () => ({
  reviewApi: {
    getOrderReviewStatus: jest.fn(),
    submitReview: jest.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

test('renders already submitted review card', async () => {
  (reviewApi.getOrderReviewStatus as jest.Mock).mockResolvedValueOnce({
    result: {
      orderId: 'o1',
      myReviewSubmitted: true,
      myReview: {
        reviewId: 'r1',
        rating: 5,
        comment: 'Dịch vụ tuyệt vời!',
      },
    },
  });

  await renderWithClient(<OrderReviewCard orderId="o1" />);

  expect(await screen.findByText('Dịch vụ tuyệt vời!')).toBeTruthy();
  expect(screen.getByText('Bạn đã gửi đánh giá')).toBeTruthy();
  expect(screen.getByText('5 / 5')).toBeTruthy();
});

test('allows submitting review when not yet submitted', async () => {
  (reviewApi.getOrderReviewStatus as jest.Mock).mockResolvedValueOnce({
    result: {
      orderId: 'o1',
      myReviewSubmitted: false,
    },
  });
  (reviewApi.submitReview as jest.Mock).mockResolvedValueOnce({
    result: { reviewId: 'r2' },
  });

  await renderWithClient(<OrderReviewCard orderId="o1" />);

  expect(await screen.findByText('Gửi đánh giá')).toBeTruthy();
  await fireEvent.press(screen.getByText('Gửi đánh giá'));

  await waitFor(() => {
    expect(reviewApi.submitReview).toHaveBeenCalledWith({
      orderId: 'o1',
      rating: 5,
      comment: undefined,
    });
  });
});
