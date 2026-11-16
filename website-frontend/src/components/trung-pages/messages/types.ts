// Shapes of the messaging store in messageApi.js.

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
  // The counterpart's user id.
  participantId: string;
  // Remembered on this device when the thread was opened; null otherwise.
  participantName: string | null;
  participantRole: ParticipantRole | null;
  context?: ConversationContext;
  lastMessageAt: string;
  // False until the first message; lastMessageAt is then the creation time.
  hasMessages: boolean;
  unreadCount: number;
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
  pending?: boolean;
  failed?: boolean;
  clientMessageId?: string;
};

export type MessageState = {
  userId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  conversations: Conversation[];
  messages: ChatMessage[];
  hasOlder: Record<string, boolean>;
};

// Who to open a thread with, handed to the shell's "messages" navigation.
// participantId is a user id; a provider known only by its provider profile id
// is passed as providerId and resolved to its user id.
export type ChatTarget = {
  participantId?: string;
  providerId?: string;
  participantName: string;
  participantRole: ParticipantRole;
  context?: ConversationContext;
};

export type ConversationView = Omit<Conversation, "participantName"> & {
  participantName: string;
  lastMessage: ChatMessage | null;
  unread: number;
};
