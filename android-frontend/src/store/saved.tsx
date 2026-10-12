import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth';
import { hapticFeedback } from '@/utils/haptics';

export const SAVED_KEY_PREFIX = 'workgo_saved_jobs_v1:';
const MAX_SAVED = 200;

export async function restore(userId: string | null | undefined, prevList: string[]): Promise<void> {
  const uid = userId || 'guest';
  const key = `${SAVED_KEY_PREFIX}${uid}`;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(prevList));
  } catch {
    // Ignore storage errors
  }
}

interface SavedContextType {
  savedIds: string[];
  isSaved: (postId: string) => boolean;
  toggleSaved: (postId: string) => Promise<boolean>;
  restoreSaved: (prevList: string[]) => Promise<void>;
  loading: boolean;
}

const SavedContext = createContext<SavedContextType>({
  savedIds: [],
  isSaved: () => false,
  toggleSaved: async () => false,
  restoreSaved: async () => {},
  loading: false,
});

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.userId || 'guest';
  const storageKey = `${SAVED_KEY_PREFIX}${userId}`;

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from AsyncStorage when userId changes
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (active) {
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setSavedIds(parsed.filter((id): id is string => typeof id === 'string'));
            } else {
              setSavedIds([]);
            }
          } else {
            setSavedIds([]);
          }
        }
      } catch {
        if (active) setSavedIds([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [storageKey]);

  const isSaved = useCallback(
    (postId: string) => savedIds.includes(postId),
    [savedIds]
  );

  const toggleSaved = useCallback(
    async (postId: string): Promise<boolean> => {
      let next: string[];
      let added = false;
      if (savedIds.includes(postId)) {
        next = savedIds.filter((id) => id !== postId);
        added = false;
      } else {
        next = [postId, ...savedIds].slice(0, MAX_SAVED);
        added = true;
      }
      setSavedIds(next);
      void hapticFeedback.selection();
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignored
      }
      return added;
    },
    [savedIds, storageKey]
  );

  const restoreSaved = useCallback(
    async (prevList: string[]): Promise<void> => {
      setSavedIds(prevList);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(prevList));
      } catch {
        // Ignored
      }
    },
    [storageKey]
  );

  return (
    <SavedContext.Provider value={{ savedIds, isSaved, toggleSaved, restoreSaved, loading }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSavedJobs() {
  return useContext(SavedContext);
}
