import { StyleSheet, Text, View } from 'react-native';

import type { OrderDto } from '@/api/types';
import { formatDateTime, formatVnd } from '@/lib/format';
import { Badge, Card, colors, font, spacing } from '@/ui';

import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from './orderStatus';

export function OrderRow({ order, onPress }: { order: OrderDto; onPress: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={order.title}>
      <View style={styles.head}>
        <Text style={styles.number}>{order.orderNumber ?? order.orderId.slice(0, 8)}</Text>
        <Badge label={ORDER_STATUS_LABEL[order.orderStatus]} tone={ORDER_STATUS_TONE[order.orderStatus]} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {order.title}
      </Text>
      <View style={styles.head}>
        <Text style={styles.muted}>{formatDateTime(order.placedAt ?? order.createdAt)}</Text>
        <Text style={styles.amount}>{formatVnd(Number(order.totalAmount ?? 0))}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  number: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.small, color: colors.muted },
  amount: { fontSize: font.body, fontWeight: '700', color: colors.primaryDark },
});
