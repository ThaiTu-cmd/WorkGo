import { act, renderHook } from '@testing-library/react-native';

import { useSingleFlight } from '../useSingleFlight';

test('a second call while the first is running is ignored, even before any re-render', async () => {
  const { result } = await renderHook(() => useSingleFlight());
  let resolve!: () => void;
  const work = jest.fn(() => new Promise<void>((r) => (resolve = r)));

  const first = result.current(work);
  const second = result.current(work);
  expect(work).toHaveBeenCalledTimes(1);
  expect(second).toBeUndefined();

  await act(async () => {
    resolve();
    await first;
  });
  result.current(work);
  expect(work).toHaveBeenCalledTimes(2);
});

test('the guard is released after a failure', async () => {
  const { result } = await renderHook(() => useSingleFlight());
  const failing = jest.fn(async () => {
    throw new Error('boom');
  });
  await act(async () => {
    await result.current(failing)?.catch(() => {});
  });
  await act(async () => {
    await result.current(failing)?.catch(() => {});
  });
  expect(failing).toHaveBeenCalledTimes(2);
});
