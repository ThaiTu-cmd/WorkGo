import { http } from '../client';
import { reviewApi } from '../reviewApi';

jest.mock('../client', () => ({ http: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

test('submitReview posts to /trust/reviews', async () => {
  (http.post as jest.Mock).mockResolvedValueOnce({ result: { reviewId: 'r1' } });
  const res = await reviewApi.submitReview({ orderId: 'o1', rating: 5, comment: 'Dịch vụ tốt' });
  expect(http.post).toHaveBeenCalledWith('/trust/reviews', { orderId: 'o1', rating: 5, comment: 'Dịch vụ tốt' });
  expect(res.result.reviewId).toBe('r1');
});

test('getServiceReviews calls /trust/services/:id/reviews', async () => {
  (http.get as jest.Mock).mockResolvedValueOnce({ result: { ratingAvg: 4.5, ratingCount: 10 } });
  const res = await reviewApi.getServiceReviews('s1', 0, 10);
  expect(http.get).toHaveBeenCalledWith('/trust/services/s1/reviews', { params: { page: 0, size: 10 } });
  expect(res.result.ratingAvg).toBe(4.5);
});

test('getOrderReviewStatus calls /trust/reviews/orders/:id', async () => {
  (http.get as jest.Mock).mockResolvedValueOnce({ result: { myReviewSubmitted: true } });
  const res = await reviewApi.getOrderReviewStatus('o1');
  expect(http.get).toHaveBeenCalledWith('/trust/reviews/orders/o1');
  expect(res.result.myReviewSubmitted).toBe(true);
});
