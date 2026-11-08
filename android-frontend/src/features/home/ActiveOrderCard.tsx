import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OrderDto } from '@/api/types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/features/orders/orderStatus';
import { Badge, colors, font, radius, spacing } from '@/ui';

export function ActiveOrderCard({ order }: { order: OrderDto }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Đơn đang xử lý ${order.title}`}
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.orderId, role: 'CLIENT' } })}
      style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="receipt-outline" size={20} color={colors.warning} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.caption}>Đơn đang xử lý</Text>
        <Text style={styles.title} numberOfLines={1}>
          {order.title}
        </Text>
        <Badge label={ORDER_STATUS_LABEL[order.orderStatus]} tone={ORDER_STATUS_TONE[order.orderStatus]} />
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  icon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: '#FAEEDA', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  caption: { fontSize: font.small, color: colors.muted },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
});
