import * as React from 'react';

// Runs `work` unless a previous call is still running. A ref (not state) so a
// second tap queued before the next render is still rejected — a disabled
// button only helps once React has re-rendered.
export function useSingleFlight() {
  const busy = React.useRef(false);
  return React.useCallback(<T,>(work: () => Promise<T>): Promise<T> | undefined => {
    if (busy.current) return undefined;
    busy.current = true;
    return work().finally(() => {
      busy.current = false;
    });
  }, []);
}
