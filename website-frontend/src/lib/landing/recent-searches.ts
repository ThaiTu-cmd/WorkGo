export const RECENT_SEARCHES_KEY = "workgo_recent_searches";
export const RECENT_SEARCHES_MAX = 5;

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadRecentSearches(): string[] {
  const store = safeStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, RECENT_SEARCHES_MAX);
  } catch {
    return [];
  }
}

export function recordRecentSearch(q: string): string[] {
  const clean = q.replace(/\s+/g, " ").trim().slice(0, 100);
  if (!clean) return loadRecentSearches();
  const current = loadRecentSearches();
  const next = [
    clean,
    ...current.filter((s) => s.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, RECENT_SEARCHES_MAX);
  try {
    safeStorage()?.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // Silently ignore quota exceeded or private mode restriction
  }
  return next;
}

export function clearRecentSearches(): void {
  try {
    safeStorage()?.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently ignore
  }
}
