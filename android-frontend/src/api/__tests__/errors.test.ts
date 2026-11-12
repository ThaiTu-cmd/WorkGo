import { ApiError, errorMessage, evidenceErrorMessage, NOT_PROVIDER_MESSAGE, paymentErrorMessage, UNREACHABLE_MESSAGE } from '../errors';

test('evidenceErrorMessage maps 2023', () => {
  expect(evidenceErrorMessage(new ApiError(400, { code: 2023 }))).toBe('Vui lòng chụp hoặc chọn một ảnh.');
});

test('evidenceErrorMessage maps 1008 and 2021', () => {
  expect(evidenceErrorMessage(new ApiError(400, { code: 1008 }))).toBe(
    'Chỉ chuyên gia nhận đơn này mới được gửi bằng chứng.'
  );
  expect(evidenceErrorMessage(new ApiError(400, { code: 2021 }))).toBe(
    'Chỉ gửi được bằng chứng khi đơn đang được thực hiện tại nhà.'
  );
});

test('evidenceErrorMessage falls back to the server message, then a generic one', () => {
  expect(evidenceErrorMessage(new ApiError(400, { code: 9999, message: 'Boom' }))).toBe('Boom');
  expect(evidenceErrorMessage(null)).toBe('Không gửi được bằng chứng. Vui lòng thử lại.');
});

test('errorMessage uses ApiError message and a generic fallback', () => {
  expect(errorMessage(new ApiError(0, null))).toBe(UNREACHABLE_MESSAGE);
  expect(errorMessage(new ApiError(400, { message: 'Bad' }))).toBe('Bad');
  expect(errorMessage(undefined)).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.');
});

test('NOT_PROVIDER_MESSAGE matches the web copy', () => {
  expect(NOT_PROVIDER_MESSAGE).toContain('Tài khoản chưa có quyền Chuyên gia.');
});

test('paymentErrorMessage maps payment-service codes, which overlap order-service 3xxx', () => {
  expect(paymentErrorMessage(new ApiError(409, { code: 3003 }))).toBe('Đơn này đã được thanh toán.');
  expect(paymentErrorMessage(new ApiError(400, { code: 3012 }))).toBe(
    'Số tiền nằm ngoài hạn mức của cổng thanh toán này. Hãy chọn cổng khác.'
  );
});

test('paymentErrorMessage falls back to the server message, then a generic one', () => {
  expect(paymentErrorMessage(new ApiError(400, { code: 9999, message: 'Boom' }))).toBe('Boom');
  expect(paymentErrorMessage(null)).toBe('Không thực hiện được thanh toán. Vui lòng thử lại.');
});
