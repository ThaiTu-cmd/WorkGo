import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import type { ContextType } from '@/api/types';
import { ChatScreen } from '@/features/chat/ChatScreen';

export default function ChatRoute() {
  const params = useLocalSearchParams<{
    id?: string;
    conversationId?: string;
    participantId?: string;
    participantName?: string;
    contextType?: ContextType;
    contextId?: string;
  }>();

  // If the route param `id` looks like a conversation id, or use specific params
  const conversationId = params.conversationId ?? (params.id && !params.participantId ? params.id : undefined);

  return (
    <ChatScreen
      conversationId={conversationId}
      participantId={params.participantId}
      participantName={params.participantName}
      contextType={params.contextType}
      contextId={params.contextId ?? params.id}
    />
  );
}
