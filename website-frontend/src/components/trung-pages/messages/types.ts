// Shapes of the messaging store in _webapp-mirror/api/messageApi.js.

export type ParticipantRole = "CLIENT" | "PROVIDER";

export type ConversationContext = {
  type: "service" | "order";
  id: string | null;
  title: string;
  label?: string;
  status?: string;
};

export type Conversation = {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: ParticipantRole;
  context?: ConversationContext;
  lastMessageAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: string[];
  createdAt: string;
  read: boolean;
  seen?: boolean;
};

export type MessageState = {
  conversations: Conversation[];
  messages: ChatMessage[];
};

// Who to open a thread with, handed to the shell's "messages" navigation.
export type ChatTarget = {
  participantId: string;
  participantName: string;
  participantRole: ParticipantRole;
  context?: ConversationContext;
};

export type ConversationView = Conversation & {
  lastMessage: ChatMessage | null;
  unread: number;
};
