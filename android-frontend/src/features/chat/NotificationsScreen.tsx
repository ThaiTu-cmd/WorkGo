import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { notificationApi, type NotificationDto } from '@/api/notificationApi';
import { pageItems } from '@/api/adapters';
import { useAuth } from '@/auth/AuthProvider';
import { LoginRequired } from '@/auth/LoginRequired';
import { Button, Card, ErrorState, Screen } from '@/ui';
import { useT } from '@/i18n';
import { useEffect, useRef } from 'react';

export function NotificationsScreen() {
  const { claims } = useAuth();
  return claims?.userId ? <Inbox key={claims.userId} userId={claims.userId} /> : <LoginRequired />;
}
function Inbox({ userId }: { userId: string }) {
  const t = useT();
  const router = useRouter();
  const client = useQueryClient();
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const key = ['notifications', userId];
  const list = useInfiniteQuery({
    queryKey: key, initialPageParam: 0, refetchInterval: 30000,
    queryFn: ({ pageParam }) => notificationApi.list(pageParam),
    getNextPageParam: (last, pages) => pages.length < (last?.result?.totalPages ?? 1) ? pages.length : undefined,
  });
  const read = useMutation({
    mutationFn: async (item: NotificationDto | null) => {
      if (!item) await notificationApi.readAll();
      else if (!item.readAt) await notificationApi.markRead(item.id);
      return item;
    },
    onSuccess: item => {
      if (!alive.current) return;
      void client.invalidateQueries({ queryKey: key });
      if (item?.referenceType === 'ORDER' && item.referenceId) router.push({ pathname: '/orders/[id]', params: { id: item.referenceId } });
      if (item?.referenceType === 'SERVICE' && item.referenceId) router.push({ pathname: '/service/[id]', params: { id: item.referenceId } });
    },
  });
  const items = list.data?.pages.flatMap(page => pageItems<NotificationDto>(page)) ?? [];
  return <Screen edges={['bottom']}>
    <Button title={t('notifications.readAll')} disabled={read.isPending} onPress={() => read.mutate(null)} />
    {(list.isError || read.isError) && <ErrorState message={t('states.khong_tai_duoc_du_lieu')} onRetry={() => { read.reset(); void list.refetch(); }} />}
    {!list.isPending && !list.isError && !items.length && <Text>{t('notifications.empty')}</Text>}
    {items.map(item => <Pressable key={item.id} accessibilityRole="button" disabled={read.isPending} onPress={() => read.mutate(item)}><Card><Text style={{ fontWeight: item.readAt ? '400' : '700' }}>{item.title}</Text><Text>{item.content}</Text></Card></Pressable>)}
    {list.hasNextPage && <Button title={t('chat.older')} loading={list.isFetchingNextPage} onPress={() => void list.fetchNextPage()} />}
  </Screen>;
}
