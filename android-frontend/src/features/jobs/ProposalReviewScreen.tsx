import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { jobApi, type OrderSyncStatus, type ProposalDto } from '@/api/jobApi';
import type {RewardQuoteDto} from '@/api/types';
import { qk } from '@/api/queryKeys';
import { formatDate, formatVnd } from '@/lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, font, makeStyles, radius, SkeletonList, spacing, useColors } from '@/ui';

export function ProposalReviewScreen({
  jobId: propJobId,
  onNavigateToOrder,
}: {
  jobId?: string;
  onNavigateToOrder?: (orderId: string) => void;
} = {}) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const activeJobId = propJobId || params.id || '';

  // Concurrency Lock
  const [rewardQuotes,setRewardQuotes]=React.useState<Record<string,RewardQuoteDto>>({});
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Sync state tracking per proposal: { status, orderId }
  const [syncStates, setSyncStates] = React.useState<Record<string, { status: OrderSyncStatus; orderId?: string }>>({});

  const proposalsQuery = useQuery({
    queryKey: qk.jobProposals(activeJobId),
    queryFn: async () => {
      const res = await jobApi.getJobProposals(activeJobId, { page: 0, size: 50 });
      return res.result?.data ?? [];
    },
    enabled: Boolean(activeJobId),
  });

  const proposals: ProposalDto[] = proposalsQuery.data ?? [];
  const hasAccepted = proposals.some((p) => p.status === 'ACCEPTED');

  const preview=useMutation({mutationFn:async(id:string)=>({id,quote:(await jobApi.getProposalRewardQuote(id)).result}),
    onSuccess:({id,quote})=>{if(!quote?.reference||!Number.isInteger(quote.points)){Alert.alert('Lỗi','Invalid reward quote');return;}setRewardQuotes(old=>({...old,[id]:quote}));},
    onError:(e:Error)=>Alert.alert('Lỗi',e.message)});

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      setProcessingId(proposalId);
      const res = await jobApi.acceptProposal(proposalId);
      return res.result;
    },
    onSuccess: (acceptance, proposalId) => {
      const initialStatus = acceptance.orderSyncStatus || acceptance.status || 'PENDING';
      setSyncStates((prev) => ({
        ...prev,
        [proposalId]: { status: initialStatus, orderId: acceptance.orderId },
      }));
      void queryClient.invalidateQueries({ queryKey: qk.jobProposals(activeJobId) });
      Alert.alert('Thành công', 'Đã chấp nhận đề xuất! Hệ thống đang khởi tạo đơn hàng.');

      // Check sync status
      pollSync(proposalId);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err?.message || 'Không thể chấp nhận đề xuất.');
    },
    onSettled: () => {
      setProcessingId(null);
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      setProcessingId(proposalId);
      const res = await jobApi.rejectProposal(proposalId);
      return res.result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.jobProposals(activeJobId) });
      Alert.alert('Đã từ chối', 'Đã từ chối đề xuất này.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err?.message || 'Không thể từ chối đề xuất.');
    },
    onSettled: () => {
      setProcessingId(null);
    },
  });

  // Retry Order Creation Mutation
  const retryOrderMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      setProcessingId(proposalId);
      const res = await jobApi.retryOrder(proposalId);
      return res.result;
    },
    onSuccess: (acceptance, proposalId) => {
      const status = acceptance.orderSyncStatus || acceptance.status || 'PENDING';
      setSyncStates((prev) => ({
        ...prev,
        [proposalId]: { status, orderId: acceptance.orderId },
      }));
      pollSync(proposalId);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err?.message || 'Không thể thử lại tạo đơn.');
    },
    onSettled: () => {
      setProcessingId(null);
    },
  });

  const pollSync = async (proposalId: string, attempts = 0) => {
    try {
      const syncRes = await jobApi.orderSync(proposalId);
      const r = syncRes.result;
      const status = r.orderSyncStatus || r.status || 'PENDING';
      setSyncStates((prev) => ({
        ...prev,
        [proposalId]: { status, orderId: r.orderId },
      }));
      if (status === 'PENDING' && attempts < 5) {
        setTimeout(() => {
          void pollSync(proposalId, attempts + 1);
        }, 2000);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleOpenOrder = (orderId: string) => {
    if (onNavigateToOrder) {
      onNavigateToOrder(orderId);
    } else {
      router.push(`/orders/${orderId}` as any);
    }
  };

  if (!activeJobId) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <EmptyState title="Không tìm thấy việc" hint="Vui lòng kiểm tra lại mã công việc." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Đề Xuất & Báo Giá Nhận Được</Text>
        <Text style={styles.subTitle}>Xem xét năng lực và chấp thuận chuyên gia phù hợp.</Text>
      </View>

      {proposalsQuery.isPending ? (
        <View style={styles.content}>
          <SkeletonList count={3} />
        </View>
      ) : proposalsQuery.isError ? (
        <ErrorState
          message="Không thể tải danh sách đề xuất. Vui lòng thử lại."
          onRetry={() => void proposalsQuery.refetch()}
        />
      ) : proposals.length === 0 ? (
        <EmptyState
          title="Chưa có đề xuất nào"
          hint="Công việc đang mở nhận báo giá từ các chuyên gia."
          action={<Button title="Tải lại" variant="secondary" onPress={() => void proposalsQuery.refetch()} />}
        />
      ) : (
        <FlatList
          data={proposals}
          keyExtractor={(item) => item.proposalId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={proposalsQuery.isRefetching}
              onRefresh={() => void proposalsQuery.refetch()}
            />
          }
          renderItem={({ item }) => {
            const sync = syncStates[item.proposalId];
            const isItemProcessing = processingId === item.proposalId;

            return (
              <Card style={styles.proposalCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.providerName}>
                      {item.provider?.businessName || 'Chuyên gia WorkGo'}
                    </Text>
                    <Text style={styles.dateText}>Gửi ngày: {formatDate(item.createdAt)}</Text>
                  </View>
                  <Badge
                    label={
                      item.status === 'ACCEPTED'
                        ? 'Đã chấp nhận'
                        : item.status === 'REJECTED'
                        ? 'Đã từ chối'
                        : 'Đang chờ duyệt'
                    }
                    tone={
                      item.status === 'ACCEPTED'
                        ? 'success'
                        : item.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  />
                </View>

                <View style={styles.bidRow}>
                  <Text style={styles.priceText}>{formatVnd(item.price)}</Text>
                  <Text style={styles.durationText}>Hoàn thành trong: {item.estimatedDays} ngày</Text>
                </View>

                <Text style={styles.messageText}>{item.message}</Text>

                {item.terms ? (
                  <View style={styles.termsBox}>
                    <Text style={styles.termsLabel}>Cam kết:</Text>
                    <Text style={styles.termsText}>{item.terms}</Text>
                  </View>
                ) : null}

                {/* Order Outbox Sync State Banner */}
                {item.status === 'ACCEPTED' ? (
                  <View style={styles.syncBanner}>
                    {sync?.status === 'SUCCESS' ? (
                      <View style={styles.syncSuccessRow}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                        <Text style={styles.syncSuccessText}>
                          Đã tạo đơn hàng thành công! {sync.orderId ? `(#${sync.orderId.slice(0, 8)})` : ''}
                        </Text>
                        {sync.orderId ? (
                          <Button
                            title="Xem đơn"
                            variant="primary"
                            onPress={() => handleOpenOrder(sync.orderId!)}
                          />
                        ) : null}
                      </View>
                    ) : sync?.status === 'FAILED' ? (
                      <View style={styles.syncFailedRow}>
                        <Ionicons name="alert-circle" size={18} color={colors.danger} />
                        <Text style={styles.syncFailedText}>Đồng bộ tạo đơn hàng chưa thành công.</Text>
                        <Button
                          title="Thử lại"
                          loading={retryOrderMutation.isPending && isItemProcessing}
                          disabled={Boolean(processingId)}
                          onPress={() => retryOrderMutation.mutate(item.proposalId)}
                        />
                      </View>
                    ) : (
                      <View style={styles.syncPendingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.syncPendingText}>Đang đồng bộ tạo đơn hàng qua outbox...</Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Action buttons (with Concurrency Lock) */}
                {item.status === 'PENDING' && !hasAccepted ? (
                  <View style={styles.actionsRow}>
                    <View style={{ flex: 1 }}>
                      {rewardQuotes[item.proposalId]&&<Text>Thưởng dự kiến {rewardQuotes[item.proposalId].points} điểm · Còn cap cặp {rewardQuotes[item.proposalId].remainingPairCap}, Provider {rewardQuotes[item.proposalId].remainingProviderCap}.</Text>}
                      <Button
                        title={rewardQuotes[item.proposalId]?"Chấp nhận":"Xem quote trước khi chấp nhận"}
                        variant="primary"
                        loading={acceptMutation.isPending && isItemProcessing}
                        disabled={Boolean(processingId)}
                        onPress={() => {const q=rewardQuotes[item.proposalId];if(!q||Date.parse(q.expiresAt)<=Date.now())preview.mutate(item.proposalId);else acceptMutation.mutate(item.proposalId);}}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Từ chối"
                        variant="secondary"
                        loading={rejectMutation.isPending && isItemProcessing}
                        disabled={Boolean(processingId)}
                        onPress={() => rejectMutation.mutate(item.proposalId)}
                      />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  subTitle: { fontSize: font.small, color: colors.muted },
  content: { padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.md },
  proposalCard: { gap: spacing.sm, borderRadius: radius.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  providerName: { fontSize: font.body, fontWeight: '700', color: colors.text },
  dateText: { fontSize: font.small, color: colors.muted },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: font.title, fontWeight: '800', color: colors.primary },
  durationText: { fontSize: font.small, color: colors.muted },
  messageText: { fontSize: font.body, color: colors.text, lineHeight: 20 },
  termsBox: {
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: 2,
  },
  termsLabel: { fontSize: font.small, fontWeight: '700', color: colors.text },
  termsText: { fontSize: font.small, color: colors.muted },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  syncBanner: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  syncSuccessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  syncSuccessText: { fontSize: font.small, color: colors.success, fontWeight: '600', flex: 1 },
  syncFailedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  syncFailedText: { fontSize: font.small, color: colors.danger, fontWeight: '600', flex: 1 },
  syncPendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  syncPendingText: { fontSize: font.small, color: colors.primary },
  quoteText: { fontSize: font.small, color: colors.muted },
}));
