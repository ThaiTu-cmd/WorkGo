import * as React from 'react';
import { AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthProvider';
import { createCommunicationRealtime } from '@/api/communicationRealtime';

const CommunicationContext = React.createContext<ReturnType<typeof createCommunicationRealtime> | null>(null);

export function CommunicationProvider({ children }: { children: React.ReactNode }) {
  const { token, claims } = useAuth();
  const queries = useQueryClient();
  const { isConnected } = useNetInfo();
  const [appState, setAppState] = React.useState(AppState.currentState);
  React.useEffect(() => {
    const listener = AppState.addEventListener('change', setAppState);
    return () => listener.remove();
  }, []);
  const userId = claims?.userId;
  const foreground = appState !== 'background' && appState !== 'inactive';
  const connection = React.useMemo(() => token && userId && isConnected !== false && foreground
    ? createCommunicationRealtime(queries, userId, token) : null,
  [queries, userId, token, isConnected, foreground]);
  React.useEffect(() => {
    connection?.start();
    return () => connection?.stop();
  }, [connection]);
  return <CommunicationContext.Provider value={connection}>{children}</CommunicationContext.Provider>;
}

export function useConversationEvents(ids: readonly string[]) {
  const connection = React.useContext(CommunicationContext);
  React.useEffect(() => connection?.watch(ids), [connection, ids]);
}
