import { useState, useEffect } from 'react';

/**
 * Core testable debounce promise utility
 */
export function debounceValue<T>(value: T, delay = 300): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(value);
    }, delay);
    if (typeof timer === 'object' && timer && 'unref' in timer) {
      (timer as { unref: () => void }).unref();
    }
  });
}

/**
 * React hook returning a debounced value
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
