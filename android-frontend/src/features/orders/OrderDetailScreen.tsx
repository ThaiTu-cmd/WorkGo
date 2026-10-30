import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import type { OrderRole } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatDateTime, formatVnd } from '@/lib/format';
import { Badge, Card, colors, ErrorState, font, Screen, SkeletonList, spacing } from '@/ui';

import { EvidenceGrid } from './EvidenceGrid';
import { useOrderDetail } from './hooks';
import { ONSITE_STATUS_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from './orderStatus';

const money = (v: unknown) => formatVnd(Number(v ?? 0));

// `evidenceFooter` lets the provider task add its upload button without
// this screen knowing about uploads.
export function OrderDetailScreen({
  evidenceFooter,
}: {
  evidenceFooter?: (ctx: { orderId: string; role: OrderRole; detail: ReturnType<typeof useOrderDetail> }) => React.ReactNode;
}) {
  const signedIn = useRequireAuth();
  const { id, role: roleParam } = useLocalSearchParams<{ id: string; role?: string }>();
  const role: OrderRole = roleParam === 'PROVIDER' ? 'PROVIDER' : 'CLIENT';
  const detail = useOrderDetail(id, signedIn);
  const { order, history, execution } = detail;

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (order.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={3} height={100} />
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState message={errorMessage(order.error)} onRetry={() => void order.refetch()} />
      </Screen>
    );
  }

  const o = order.data;
  const onsite = execution.data?.onsite;
  const refresh = () => {
    void order.refetch();
    void history.refetch();
    void execution.refetch();
  };

  return (
    <Screen edges={['bottom']} onRefresh={refresh} refreshing={order.isRefetching}>
      <Card>
        <View style={styles.row}>
          <Text style={styles.muted}>{o.orderNumber ?? o.orderId}</Text>
          <Badge label={ORDER_STATUS_LABEL[o.orderStatus]} tone={ORDER_STATUS_TONE[o.orderStatus]} />
        </View>
        <Text style={styles.title}>{o.title}</Text>
        {o.orderStatus === 'PENDING_PAYMENT' ? (
          <Text style={styles.muted}>Đơn đang chờ thanh toán. Thanh toán trong ứng dụng sẽ có ở phiên bản sau.</Text>
        ) : null}
      </Card>

      <Card>
        <Line label="Tạm tính" value={money(o.subtotal)} />
        <Line label="Phí nền tảng" value={money(o.platformFee)} />
        <Line label="Tổng cộng" value={money(o.totalAmount)} strong />
      </Card>

      {onsite ? (
        <Card>
          <Text style={styles.section}>Thực hiện tại nhà</Text>
          <Line label="Trạng thái" value={ONSITE_STATUS_LABEL[onsite.status]} />
          {onsite.scheduledStart ? <Line label="Lịch hẹn" value={formatDateTime(onsite.scheduledStart)} /> : null}
          {onsite.addressSnapshot ? <Text style={styles.text}>{onsite.addressSnapshot}</Text> : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.section}>Lịch sử</Text>
        {(history.data ?? []).length === 0 ? (
          <Text style={styles.muted}>Đặt lúc {formatDateTime(o.placedAt ?? o.createdAt)}</Text>
        ) : (
          (history.data ?? []).map((h, i) => (
            <View key={h.orderStatusHistoryId ?? i} style={styles.row}>
              <Text style={styles.text}>{ORDER_STATUS_LABEL[h.toStatus] ?? h.toStatus}</Text>
              <Text style={styles.muted}>{formatDateTime(h.createdAt)}</Text>
            </View>
          ))
        )}
      </Card>

      {o.executionType === 'ONSITE' ? (
        <EvidenceGrid orderId={o.orderId} footer={evidenceFooter?.({ orderId: o.orderId, role, detail })} />
      ) : null}
    </Screen>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.text, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  strong: { fontWeight: '700', color: colors.primaryDark },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
});
