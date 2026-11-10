import { assertImageSize, dataUrlBytes, MAX_IMAGE_BYTES } from '../image';

jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-image-manipulator', () => ({}));

test('dataUrlBytes of "data:image/jpeg;base64,AAAA" === 3', () => {
  expect(dataUrlBytes('data:image/jpeg;base64,AAAA')).toBe(3);
});

test('dataUrlBytes accounts for base64 padding', () => {
  expect(dataUrlBytes('data:image/jpeg;base64,AAA=')).toBe(2);
  expect(dataUrlBytes('data:image/jpeg;base64,AA==')).toBe(1);
});

test('assertImageSize throws above MAX_IMAGE_BYTES', () => {
  const chars = Math.ceil(((MAX_IMAGE_BYTES + 3) * 4) / 3);
  const big = `data:image/jpeg;base64,${'A'.repeat(chars - (chars % 4))}`;
  expect(() => assertImageSize(big)).toThrow('Ảnh quá lớn (tối đa 1MB). Hãy chọn ảnh khác.');
});

test('assertImageSize accepts an image at the limit', () => {
  const chars = (MAX_IMAGE_BYTES / 3) * 4 - ((MAX_IMAGE_BYTES / 3) * 4) % 4;
  expect(() => assertImageSize(`data:image/jpeg;base64,${'A'.repeat(chars)}`)).not.toThrow();
});
