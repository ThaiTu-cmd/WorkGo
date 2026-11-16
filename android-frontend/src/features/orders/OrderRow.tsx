import { Text, View } from 'react-native';

import type { OrderDto } from '@/api/types';
import { formatDateTime, formatVnd } from '@/lib/format';
import { Badge, Card, font, makeStyles, spacing } from '@/ui';

import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from './orderStatus';

export function OrderRow({ order, onPress }: { order: OrderDto; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Card onPress={onPress} accessibilityLabel={order.title}>
      <View style={styles.head}>
        {/* Order numbers are long (WG + timestamp + UUID): one line, so the status badge keeps its room. */}
        <Text style={styles.number} numberOfLines={1} ellipsizeMode="middle">
          {order.orderNumber ?? order.orderId.slice(0, 8)}
        </Text>
        <View style={styles.badge}>
          <Badge label={ORDER_STATUS_LABEL[order.orderStatus]} tone={ORDER_STATUS_TONE[order.orderStatus]} />
        </View>
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

const useStyles = makeStyles((colors) => ({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  number: { flexShrink: 1, fontSize: font.small, color: colors.muted, fontWeight: '600' },
  badge: { flexShrink: 0 },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.small, color: colors.muted },
  amount: { fontSize: font.body, fontWeight: '700', color: colors.primaryDark },
}));
