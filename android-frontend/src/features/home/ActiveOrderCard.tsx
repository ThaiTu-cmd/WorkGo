import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { OrderDto } from '@/api/types';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/features/orders/orderStatus';
import { Badge, font, makeStyles, radius, spacing, useColors } from '@/ui';
import { useT } from '@/i18n';

export function ActiveOrderCard({ order }: { order: OrderDto }) {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('activeOrderCard.don_dang_xu_ly', { p0: order.title })}
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.orderId, role: 'CLIENT' } })}
      style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="receipt-outline" size={20} color={colors.warning} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.caption}>{t('activeOrderCard.don_dang_xu_ly_2')}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {order.title}
        </Text>
        <Badge label={ORDER_STATUS_LABEL[order.orderStatus]} tone={ORDER_STATUS_TONE[order.orderStatus]} />
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
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
}));
