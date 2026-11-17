import { http } from './client';
import type { ApiResponse, ConversationCreateReq, ConversationDto, MessageDto, MessageSendReq, Paged } from './types';

// communication-service endpoints via gateway (/api/v1/communication/**).
export const communicationApi = {
  getConversations: (page = 0, size = 20) =>
    http.get<Paged<ConversationDto>>('/communication/conversations', { params: { page, size } }),

  createConversation: (body: ConversationCreateReq) =>
    http.post<ApiResponse<ConversationDto>>('/communication/conversations', body),

  getMessages: (conversationId: string, page = 0, size = 50) =>
    http.get<Paged<MessageDto>>(`/communication/conversations/${conversationId}/messages`, { params: { page, size } }),

  sendMessage: (conversationId: string, body: MessageSendReq) =>
    http.post<ApiResponse<MessageDto>>(`/communication/conversations/${conversationId}/messages`, body),

  markMessageRead: (messageId: string) =>
    http.post<ApiResponse<MessageDto>>(`/communication/messages/${messageId}/read`),
};
