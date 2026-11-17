import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { communicationApi } from '@/api/communicationApi';
import { pageItems } from '@/api/adapters';
import { qk } from '@/api/queryKeys';
import type { ContextType, ConversationDto, MessageDto, ParticipantDto } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { formatDateTime } from '@/lib/format';
import { Button, ErrorState, font, makeStyles, radius, spacing, useColors } from '@/ui';
import { LoginRequired } from '@/auth/LoginRequired';
import { useT } from '@/i18n';

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // MessageSendReq requires UUID syntax. This key is for deduplication, not authentication.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const value = Math.floor(Math.random() * 16);
    return (ch === 'x' ? value : (value & 3) | 8).toString(16);
  });
}

export type ChatScreenProps = {
  conversationId?: string;
  participantId?: string;
  participantName?: string;
  contextType?: ContextType;
  contextId?: string;
};

export function ChatScreen(props: ChatScreenProps) {
  const { claims } = useAuth();
  if (!claims?.userId) return <LoginRequired />;
  return <ChatSession key={`${claims.userId}:${props.conversationId ?? props.participantId}:${props.contextId}`} {...props} />;
}

function ChatSession({
  conversationId: initialConversationId,
  participantId,
  participantName,
  contextId,
}: ChatScreenProps) {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const queryClient = useQueryClient();
  const { claims } = useAuth();
  const currentUserId = claims?.userId;

  const [activeConvId, setActiveConvId] = React.useState<string | undefined>(initialConversationId);
  const [inputText, setInputText] = React.useState<string>('');
  const [openError, setOpenError] = React.useState(false);
  const [openAttempt, setOpenAttempt] = React.useState(0);
  const outgoing = React.useRef<{ content: string; clientMessageId: string } | null>(null);
  const readMessages = React.useRef(new Set<string>());

  // If conversationId wasn't passed directly, find or create it
  React.useEffect(() => {
    let cancelled = false;
    if (activeConvId || !participantId) return;

    (async () => {
      try {
        const listRes = await communicationApi.getConversations(0, 50);
        const conversations = pageItems<ConversationDto>(listRes);
        const found = conversations.find(
          (c: ConversationDto) =>
            c.contextType === 'GENERAL' &&
            c.participants?.some((p: ParticipantDto) => p.userId === participantId)
        );
        if (cancelled) return;
        if (found) {
          setActiveConvId(found.id);
        } else {
          const created = await communicationApi.createConversation({
            participantId,
            contextType: 'GENERAL',
            contextId: null,
          });
          if (!cancelled && created?.result?.id) {
            setActiveConvId(created.result.id);
          }
        }
      } catch {
        if (!cancelled) setOpenError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConvId, participantId, openAttempt]);

  const messagesQuery = useInfiniteQuery({
    queryKey: [...qk.messages(activeConvId ?? 'pending'), currentUserId],
    enabled: !!activeConvId,
    refetchInterval: 4000,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => communicationApi.getMessages(activeConvId!, pageParam, 50),
    getNextPageParam: (last, pages) => {
      const total = last?.result?.totalPages;
      return total !== undefined ? (pages.length < total ? pages.length : undefined) : (pageItems(last).length === 50 ? pages.length : undefined);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConvId) throw new Error(t('chat.khong_the_gui_tin_nhan'));
      if (outgoing.current?.content !== content) outgoing.current = { content, clientMessageId: randomId() };
      return communicationApi.sendMessage(activeConvId, outgoing.current);
    },
    onSuccess: () => {
      setInputText('');
      outgoing.current = null;
      void queryClient.invalidateQueries({ queryKey: qk.messages(activeConvId!) });
    },
  });

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const messages = React.useMemo(() => {
    const byId = new Map<string, MessageDto>();
    for (const page of messagesQuery.data?.pages ?? []) for (const item of pageItems<MessageDto>(page)) byId.set(item.id, item);
    return [...byId.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }, [messagesQuery.data]);
  React.useEffect(() => {
    for (const message of messages) {
      if (message.senderId === currentUserId || message.readAt || readMessages.current.has(message.id)) continue;
      readMessages.current.add(message.id);
      void communicationApi.markMessageRead(message.id).then(() => {
        void queryClient.invalidateQueries({ queryKey: qk.conversations() });
      }).catch(() => { readMessages.current.delete(message.id); });
    }
  }, [messages, messagesQuery.dataUpdatedAt, currentUserId, queryClient]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}>
      {openError && <ErrorState message={t('chat.khong_the_gui_tin_nhan')} onRetry={() => { setOpenError(false); setOpenAttempt(v => v + 1); }} />}
      {messagesQuery.isError && <ErrorState message={t('states.khong_tai_duoc_du_lieu')} onRetry={() => void messagesQuery.refetch()} />}
      {sendMutation.isError && <Text accessibilityRole="alert">{t('chat.khong_the_gui_tin_nhan')}</Text>}
      {messagesQuery.hasNextPage && <Button title={t('chat.older')} disabled={messagesQuery.isFetchingNextPage} onPress={() => void messagesQuery.fetchNextPage()} />}
      {participantName ? (
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{participantName}</Text>
          {contextId ? <Text style={styles.headerSubtitle}>#{contextId.slice(0, 8)}</Text> : null}
        </View>
      ) : null}

      {messagesQuery.isPending && !messages.length ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>{t('chat.chua_co_tin_nhan')}</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMine = item.senderId === currentUserId;
            return (
              <View style={[styles.bubbleWrapper, isMine ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
                <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.bubbleText, isMine ? styles.myBubbleText : styles.theirBubbleText]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.theirTimeText]}>
                    {formatDateTime(item.sentAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('chat.nhap_tin_nhan')}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={5000}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.gui')}
          disabled={!activeConvId || !inputText.trim() || sendMutation.isPending}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            (!inputText.trim() || sendMutation.isPending) && styles.sendButtonDisabled,
            pressed && styles.pressed,
          ]}>
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={18} color={colors.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.bg },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyText: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
  headerBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: font.small, color: colors.muted },
  messageList: { padding: spacing.md, gap: spacing.sm },
  bubbleWrapper: { flexDirection: 'row', marginVertical: 2 },
  myBubbleWrapper: { justifyContent: 'flex-end' },
  theirBubbleWrapper: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  myBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 2 },
  bubbleText: { fontSize: font.body, lineHeight: 22 },
  myBubbleText: { color: colors.white },
  theirBubbleText: { color: colors.text },
  timeText: { fontSize: font.small - 2, marginTop: 2, alignSelf: 'flex-end' },
  myTimeText: { color: colors.white, opacity: 0.8 },
  theirTimeText: { color: colors.muted },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: font.body,
  },
  sendButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sendButtonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
}));
