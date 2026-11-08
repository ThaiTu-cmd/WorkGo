import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ServiceCard } from '@/api/adapters';
import { categoryVisual } from '@/features/catalog/categoryVisuals';
import type { HomeRail } from '@/features/catalog/homeRails';
import { formatVnd } from '@/lib/format';
import { colors, font, radius, spacing } from '@/ui';

export function ServiceRail({ rail }: { rail: HomeRail }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>{rail.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem tất cả ${rail.title}`}
          hitSlop={8}
          onPress={() => router.push({ pathname: '/explore', params: { ...rail.explore, t: String(Date.now()) } })}>
          <Text style={styles.more}>Xem tất cả</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={rail.items}
        keyExtractor={(s) => s.serviceId}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ServiceTile service={item} onPress={() => router.push(`/service/${item.serviceId}`)} />}
      />
    </View>
  );
}

function ServiceTile({ service, onPress }: { service: ServiceCard; onPress: () => void }) {
  const v = categoryVisual(service.categorySlug);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={service.title} onPress={onPress} style={styles.tile}>
      <View style={[styles.art, { backgroundColor: v.bg }]}>
        <Ionicons name={v.icon} size={30} color={v.fg} />
        {service.executionType === 'ONSITE' ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Tại nhà</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {service.title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="star" size={12} color="#EF9F27" />
          <Text style={styles.metaText}>
            {service.reviewCount > 0 ? service.avgRating.toFixed(1) : 'Mới'} · {service.orderCount} đơn
          </Text>
        </View>
        <Text style={styles.price}>{formatVnd(service.basePrice)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: spacing.lg },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  more: { fontSize: font.small + 1, fontWeight: '600', color: colors.primaryDark },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  tile: { width: 150, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' },
  art: { height: 76, alignItems: 'center', justifyContent: 'center' },
  pill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pillText: { fontSize: 10, fontWeight: '600', color: colors.info },
  body: { padding: spacing.sm, gap: 3 },
  name: { fontSize: font.small + 1, fontWeight: '700', color: colors.text, minHeight: 34 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: font.small - 1, color: colors.muted },
  price: { fontSize: font.small + 1, fontWeight: '700', color: colors.primaryDark },
});
