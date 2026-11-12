import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { OrderRole } from '@/api/types';
import { formatVnd } from '@/lib/format';
import { Badge, Card, colors, font, spacing, type Tone } from '@/ui';

import { ESCROW_STATUS_LABEL } from './payment';

const money = (v: unknown) => formatVnd(Number(v ?? 0));

const TONE: Record<string, Tone> = {
  HOLDING: 'info',
  RELEASED: 'success',
  REFUNDED: 'neutral',
  PARTIALLY_REFUNDED: 'warning',
  FROZEN: 'danger',
};

// Where the order's money is. Hidden until payment-service has an escrow
// for the order (3101 before payment) or when it cannot be loaded.
export function EscrowCard({ orderId, role }: { orderId: string; role: OrderRole }) {
  const escrow = useQuery({
    queryKey: qk.escrow(orderId),
    queryFn: async () => (await paymentApi.getEscrow(orderId)).result,
    // No escrow yet (e.g. an order cancelled before payment) is a final answer.
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
  const e = escrow.data;
  if (!e) return null;

  const note =
    e.status === 'HOLDING'
      ? role === 'PROVIDER'
        ? `Bạn nhận ${money(e.providerNetAmount)} sau khi khách nghiệm thu đơn.`
        : 'Tiền được giữ an toàn và chỉ chuyển cho chuyên gia sau khi bạn nghiệm thu đơn.'
      : e.status === 'FROZEN'
        ? 'Tiền đang tạm khóa trong lúc xử lý tranh chấp.'
        : null;

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.section}>Ký quỹ (Escrow)</Text>
        <Badge label={ESCROW_STATUS_LABEL[e.status] ?? e.status} tone={TONE[e.status] ?? 'neutral'} />
      </View>
      <Line label="Tổng tiền ký quỹ" value={money(e.heldAmount)} />
      {Number(e.releasedAmount ?? 0) > 0 ? <Line label="Đã chuyển cho chuyên gia" value={money(e.releasedAmount)} /> : null}
      {Number(e.refundedAmount ?? 0) > 0 ? <Line label="Đã hoàn tiền" value={money(e.refundedAmount)} /> : null}
      {note ? <Text style={styles.muted}>{note}</Text> : null}
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
});
