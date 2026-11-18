import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { WalletDto, WalletEntryDto, WalletEntryType } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatDateTime, formatVnd } from '@/lib/format';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  font,
  makeStyles,
  Screen,
  SkeletonList,
  spacing,
  useColors,
  type Tone,
} from '@/ui';

type FilterType = 'ALL' | WalletEntryType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'TOPUP', label: 'Nạp tiền' },
  { key: 'HOLD', label: 'Ký quỹ' },
  { key: 'RELEASE', label: 'Giải ngân' },
  { key: 'FEE_DEBT', label: 'Nợ phí' },
  { key: 'PAYOUT', label: 'Rút tiền' },
  { key: 'REFUND', label: 'Hoàn tiền' },
];

export function WalletScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const signedIn = useRequireAuth();
  const queryClient = useQueryClient();

  const [filter, setFilter] = React.useState<FilterType>('ALL');

  const walletQuery = useQuery({
    queryKey: qk.wallet(),
    enabled: signedIn,
    queryFn: async () => {
      const res = await paymentApi.getWallet();
      return (res?.result ?? res) as WalletDto;
    },
  });

  const ledgerQuery = useQuery({
    queryKey: qk.walletLedger({ type: filter }),
    enabled: signedIn,
    queryFn: async () => {
      const res = await paymentApi.getWalletLedger({
        page: 0,
        size: 50,
        type: filter === 'ALL' ? undefined : filter,
      });
      const data = res?.result ?? res;
      if (Array.isArray(data)) return data as WalletEntryDto[];
      if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as { content?: unknown[] }).content)) {
        return (data as { content: WalletEntryDto[] }).content;
      }
      return [] as WalletEntryDto[];
    },
  });

  const onRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.wallet() }),
      queryClient.invalidateQueries({ queryKey: qk.walletLedger() }),
    ]);
  };

  if (!signedIn) {
    return (
      <Screen>
        <LoginRequired message="Vui lòng đăng nhập để xem thông tin ví và lịch sử số dư." />
      </Screen>
    );
  }

  const wallet = walletQuery.data ?? { availableBalance: 0, heldBalance: 0, debtBalance: 0 };
  const available = Number(wallet.availableBalance ?? 0);
  const held = Number(wallet.heldBalance ?? 0);
  const debt = Number(wallet.debtBalance ?? 0);
  const entries = ledgerQuery.data ?? [];

  const getTone = (type?: WalletEntryType): Tone => {
    switch (type) {
      case 'TOPUP':
      case 'RELEASE':
      case 'REFUND':
        return 'success';
      case 'HOLD':
        return 'warning';
      case 'FEE_DEBT':
        return 'danger';
      case 'PAYOUT':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getTypeLabel = (type?: WalletEntryType): string => {
    switch (type) {
      case 'TOPUP':
        return 'Nạp tiền';
      case 'HOLD':
        return 'Ký quỹ';
      case 'RELEASE':
        return 'Giải ngân';
      case 'REFUND':
        return 'Hoàn tiền';
      case 'FEE_DEBT':
        return 'Nợ phí';
      case 'PAYOUT':
        return 'Rút tiền';
      default:
        return 'Bút toán';
    }
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={walletQuery.isRefetching || ledgerQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ví & Ký quỹ</Text>
          <Text style={styles.sub}>Quản lý số dư, tiền ký quỹ đơn hàng và lịch sử bút toán.</Text>
        </View>

        {/* Debt warning banner if debt > 0 */}
        {debt > 0 ? (
          <Card style={styles.debtCard}>
            <View style={styles.debtRow}>
              <Ionicons name="alert-circle" size={24} color={colors.danger} />
              <View style={styles.debtContent}>
                <Text style={styles.debtTitle}>Tài khoản đang có dư nợ: {formatVnd(debt)}</Text>
                <Text style={styles.debtDesc}>
                  Dư nợ phát sinh từ phí dịch vụ các đơn ONSITE tiền mặt. Vui lòng nạp bù để tiếp tục nhận việc hoặc tạo đơn mới.
                </Text>
              </View>
            </View>
            <Button
              title={`Nạp bù ${formatVnd(debt)}`}
              variant="danger"
              onPress={() => router.push(`/payment/topup?amount=${debt}`)}
            />
          </Card>
        ) : null}

        {/* Balance cards */}
        <View style={styles.balanceGrid}>
          <Card style={[styles.balanceCard, styles.balanceCardPrimary]}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>{formatVnd(available)}</Text>
            <Text style={styles.balanceHint}>Sẵn sàng đặt đơn hoặc rút về ngân hàng</Text>
          </Card>

          <Card style={[styles.balanceCard, styles.balanceCardHeld]}>
            <Text style={styles.balanceLabel}>Đang ký quỹ (Escrow)</Text>
            <Text style={[styles.balanceValue, { color: colors.warning }]}>{formatVnd(held)}</Text>
            <Text style={styles.balanceHint}>Tạm giữ an toàn theo từng đơn dịch vụ</Text>
          </Card>

          <Card style={[styles.balanceCard, debt > 0 ? styles.balanceCardDanger : null]}>
            <Text style={styles.balanceLabel}>Dư nợ tài khoản</Text>
            <Text style={[styles.balanceValue, debt > 0 ? { color: colors.danger } : null]}>
              {formatVnd(debt)}
            </Text>
            <Text style={styles.balanceHint}>
              {debt > 0 ? 'Cần nạp bù để gỡ hạn chế nhận việc' : 'Tài khoản sạch, không nợ phí'}
            </Text>
          </Card>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <Button
            title="Nạp tiền vào ví"
            style={styles.actionBtn}
            onPress={() => router.push('/payment/topup')}
          />
          <Button
            title="Cài đặt rút tiền"
            variant="secondary"
            style={styles.actionBtn}
            onPress={() => router.push('/payment/payout-settings')}
          />
        </View>

        {/* Transaction Ledger Section */}
        <View style={styles.ledgerHeader}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </ScrollView>
        </View>

        {ledgerQuery.isLoading ? (
          <SkeletonList count={4} />
        ) : ledgerQuery.isError ? (
          <ErrorState message="Không thể tải lịch sử giao dịch ví." onRetry={() => void ledgerQuery.refetch()} />
        ) : entries.length === 0 ? (
          <Card>
            <EmptyState
              title="Chưa có giao dịch"
              hint="Chưa có bút toán nào trong lịch sử ví của bạn."
            />
          </Card>
        ) : (
          <View style={styles.entryList}>
            {entries.map((item) => {
              const entryType = (item.entryType ?? item.type ?? 'ADJUSTMENT') as WalletEntryType;
              const isCredit = entryType === 'TOPUP' || entryType === 'RELEASE' || entryType === 'REFUND';
              const isDebit = entryType === 'HOLD' || entryType === 'FEE_DEBT' || entryType === 'PAYOUT';
              const amt = Number(item.amount ?? 0);

              return (
                <Card key={item.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryTitleCol}>
                      <Text style={styles.entryLabel}>{item.description ?? item.label ?? 'Giao dịch ví'}</Text>
                      {item.referenceId ? (
                        <Text style={styles.entryRef}>Mã: {item.referenceId}</Text>
                      ) : null}
                    </View>
                    <Badge label={getTypeLabel(entryType)} tone={getTone(entryType)} />
                  </View>

                  <View style={styles.entryFooter}>
                    <Text
                      style={[
                        styles.entryAmount,
                        isCredit ? { color: colors.success } : isDebit ? { color: colors.danger } : null,
                      ]}
                    >
                      {isCredit ? '+' : isDebit ? '-' : ''}
                      {formatVnd(amt)}
                    </Text>
                    <Text style={styles.entryDate}>
                      {item.createdAt || item.at ? formatDateTime(item.createdAt ?? item.at ?? '') : ''}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: font.hero,
    fontWeight: '700',
    color: colors.text,
  },
  sub: {
    fontSize: font.small,
    color: colors.muted,
  },
  debtCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
    borderWidth: 1,
    gap: spacing.sm,
  },
  debtRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  debtContent: {
    flex: 1,
    gap: 2,
  },
  debtTitle: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.danger,
  },
  debtDesc: {
    fontSize: font.small,
    color: colors.danger,
    lineHeight: 18,
  },
  balanceGrid: {
    gap: spacing.sm,
  },
  balanceCard: {
    padding: spacing.md,
    gap: 4,
  },
  balanceCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  balanceCardHeld: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  balanceCardDanger: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  balanceLabel: {
    fontSize: font.small,
    color: colors.muted,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: font.hero,
    fontWeight: '700',
    color: colors.text,
  },
  balanceHint: {
    fontSize: font.small,
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  ledgerHeader: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  filtersScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  entryList: {
    gap: spacing.sm,
  },
  entryCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  entryTitleCol: {
    flex: 1,
    gap: 2,
  },
  entryLabel: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  entryRef: {
    fontSize: font.small,
    color: colors.muted,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  entryAmount: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  entryDate: {
    fontSize: font.small,
    color: colors.muted,
  },
}));
