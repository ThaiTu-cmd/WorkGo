import { useSyncExternalStore } from 'react';
import { getServerSnapshot, getSnapshot, subscribe } from '../api/messageApi';

// Live messaging store ({ conversations, messages }) for the signed-in user;
// re-renders on any change, from this tab or another.
export function useMessages() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMessages;
