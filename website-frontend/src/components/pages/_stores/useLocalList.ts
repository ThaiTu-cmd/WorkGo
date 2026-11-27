"use client";

import { useCallback, useState } from "react";

export type LocalListApi<T extends { id?: string }> = {
  items: T[];
  add: (item: T) => boolean;
  update: (id: string, patch: Partial<T>) => boolean;
  remove: (id: string) => boolean;
  reset: () => boolean;
};

function readStored<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return seed;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

export function useLocalList<T extends { id?: string }>(
  key: string,
  seed: T[],
  onQuotaFail?: () => void,
): LocalListApi<T> {
  // SSR-safe lazy init: server renders seed, client hydrates from storage
  // with the identical first render (no post-mount setState needed).
  const [items, setItems] = useState<T[]>(() => readStored<T>(key, seed));

  const persist = useCallback(
    (next: T[]): boolean => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        return true;
      } catch {
        onQuotaFail?.();
        return false;
      }
    },
    [key, onQuotaFail],
  );

  const add = useCallback(
    (item: T): boolean => {
      let ok = true;
      setItems((prev) => {
        const next = [item, ...prev];
        ok = persist(next);
        return ok ? next : prev;
      });
      return ok;
    },
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<T>): boolean => {
      let ok = true;
      setItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
        ok = persist(next);
        return ok ? next : prev;
      });
      return ok;
    },
    [persist],
  );

  const remove = useCallback(
    (id: string): boolean => {
      let ok = true;
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        ok = persist(next);
        return ok ? next : prev;
      });
      return ok;
    },
    [persist],
  );

  const reset = useCallback((): boolean => {
    setItems(seed);
    return persist([...seed]);
  }, [persist, seed]);

  return { items, add, update, remove, reset };
}
