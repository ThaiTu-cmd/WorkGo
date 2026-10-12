export const SAVED_KEY_PREFIX = 'workgo_saved_jobs_v1:';
const MAX_SAVED_ITEMS = 200;

function getStorageKey(userId: string): string {
  return `${SAVED_KEY_PREFIX}${userId || 'guest'}`;
}

export function loadSaved(userId: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function toggleSaved(userId: string, postId: string): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const current = loadSaved(userId);
  let next: string[];
  if (current.includes(postId)) {
    next = current.filter((id) => id !== postId);
  } else {
    next = [postId, ...current].slice(0, MAX_SAVED_ITEMS);
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent('workgo:saved_changed', {
        detail: { userId: userId || 'guest', postId, saved: next.includes(postId) },
      })
    );
  } catch {
    // QuotaExceededError or storage disabled
  }

  return next;
}

export function restoreSaved(userId: string, prev: string[]): string[] {
  if (typeof window === 'undefined') {
    return prev;
  }
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(prev));
    window.dispatchEvent(
      new CustomEvent('workgo:saved_changed', {
        detail: { userId: userId || 'guest', prev },
      })
    );
  } catch {
    // QuotaExceededError or storage disabled
  }
  return prev;
}

export function isSaved(userId: string, postId: string): boolean {
  return loadSaved(userId).includes(postId);
}
