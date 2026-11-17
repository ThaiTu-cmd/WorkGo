import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { font, makeStyles, radius, spacing, useColors } from '@/ui';
import { useT } from '@/i18n';

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export type ChatScreenProps = {
  conversationId?: string;
  participantId?: string;
  participantName?: string;
  contextType?: ContextType;
  contextId?: string;
};

export function ChatScreen({
  conversationId: initialConversationId,
  participantId,
  participantName,
  contextType = 'ORDER',
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
            c.contextType === contextType &&
            (contextId ? c.contextId === contextId : true) &&
            c.participants?.some((p: ParticipantDto) => p.userId === participantId)
        );
        if (cancelled) return;
        if (found) {
          setActiveConvId(found.id);
        } else {
          const created = await communicationApi.createConversation({
            participantId,
            contextType,
            contextId: contextId ?? null,
          });
          if (!cancelled && created?.result?.id) {
            setActiveConvId(created.result.id);
          }
        }
      } catch {
        // Fallback or retry on demand
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeConvId, participantId, contextType, contextId]);

  const messagesQuery = useQuery({
    queryKey: qk.messages(activeConvId ?? 'pending'),
    enabled: !!activeConvId,
    refetchInterval: process.env.NODE_ENV === 'test' ? false : 4000,
    queryFn: async () => {
      if (!activeConvId) return [];
      const res = await communicationApi.getMessages(activeConvId, 0, 50);
      return pageItems<MessageDto>(res).reverse();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConvId) throw new Error(t('chat.khong_the_gui_tin_nhan'));
      return communicationApi.sendMessage(activeConvId, {
        content,
        clientMessageId: randomId(),
      });
    },
    onSuccess: () => {
      setInputText('');
      void queryClient.invalidateQueries({ queryKey: qk.messages(activeConvId!) });
    },
  });

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const messages = messagesQuery.data ?? [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}>
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
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.gui')}
          disabled={!inputText.trim() || sendMutation.isPending}
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
