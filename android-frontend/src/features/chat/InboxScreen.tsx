import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { communicationApi } from '@/api/communicationApi';
import { pageItems } from '@/api/adapters';
import type { ConversationDto } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { LoginRequired } from '@/auth/LoginRequired';
import { Button, Card, ErrorState, Screen, SkeletonList } from '@/ui';
import { useT } from '@/i18n';
import { useMemo } from 'react';
import { useConversationEvents } from './CommunicationProvider';

export function InboxScreen() {
  const { claims } = useAuth();
  return claims?.userId ? <Conversations key={claims.userId} userId={claims.userId} /> : <LoginRequired />;
}
function Conversations({ userId }: { userId: string }) {
  const t = useT();
  const router = useRouter();
  const list = useInfiniteQuery({
    queryKey: ['conversations', userId], initialPageParam: 0, refetchInterval: 10000,
    queryFn: ({ pageParam }) => communicationApi.getConversations(pageParam),
    getNextPageParam: (last, pages) => pages.length < (last?.result?.totalPages ?? 1) ? pages.length : undefined,
  });
  const items = list.data?.pages.flatMap(page => pageItems<ConversationDto>(page)) ?? [];
  const watched = useMemo(() => list.data?.pages.flatMap(page => pageItems<ConversationDto>(page).map(item => item.id)) ?? [], [list.data]);
  useConversationEvents(watched);
  return <Screen edges={['bottom']} onRefresh={() => void list.refetch()} refreshing={list.isRefetching}>
    {list.isPending && <SkeletonList />}
    {list.isError && <ErrorState message={t('states.khong_tai_duoc_du_lieu')} onRetry={() => void list.refetch()} />}
    {!list.isPending && !list.isError && !items.length && <Text>{t('chat.chua_co_tin_nhan')}</Text>}
    {items.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}><Card><Text>{`${item.contextType ?? 'GENERAL'} #${item.contextId ?? item.id}`}</Text><Text>{item.unreadCount ?? 0}</Text></Card></Pressable>)}
    {list.hasNextPage && <Button title={t('chat.older')} loading={list.isFetchingNextPage} onPress={() => void list.fetchNextPage()} />}
  </Screen>;
}
