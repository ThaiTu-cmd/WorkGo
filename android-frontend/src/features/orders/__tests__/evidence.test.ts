import * as Location from 'expo-location';

import { ApiError, evidenceErrorMessage } from '@/api/errors';

import { buildEvidenceBody, getLocationOrNull } from '../evidence';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const loc = Location as jest.Mocked<typeof Location>;
const image = { dataUrl: 'data:image/jpeg;base64,AAAA', capturedAt: '2026-10-30T03:00:00.000Z' };

test('buildEvidenceBody omits coordinates when location is null', () => {
  expect(buildEvidenceBody('BEFORE', image, null)).toEqual({
    phase: 'BEFORE',
    fileUrl: image.dataUrl,
    capturedAt: image.capturedAt,
  });
});

test('buildEvidenceBody includes latitude/longitude and capturedAt', () => {
  expect(buildEvidenceBody('AFTER', image, { latitude: 16.05, longitude: 108.2 })).toEqual({
    phase: 'AFTER',
    fileUrl: image.dataUrl,
    capturedAt: image.capturedAt,
    latitude: 16.05,
    longitude: 108.2,
  });
});

test('getLocationOrNull returns null when permission is refused', async () => {
  loc.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as never);
  await expect(getLocationOrNull()).resolves.toBeNull();
  expect(loc.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('getLocationOrNull returns coordinates when granted', async () => {
  loc.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
  loc.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 10.77, longitude: 106.7 } } as never);
  await expect(getLocationOrNull()).resolves.toEqual({ latitude: 10.77, longitude: 106.7 });
});

test('getLocationOrNull gives up after the timeout', async () => {
  jest.useFakeTimers();
  loc.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
  loc.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}) as never);
  const p = getLocationOrNull(5000);
  await jest.advanceTimersByTimeAsync(5000);
  await expect(p).resolves.toBeNull();
  jest.useRealTimers();
});

test('error 2021 surfaces the Vietnamese message', () => {
  expect(evidenceErrorMessage(new ApiError(400, { code: 2021 }))).toBe(
    'Chỉ gửi được bằng chứng khi đơn đang được thực hiện tại nhà.'
  );
});
