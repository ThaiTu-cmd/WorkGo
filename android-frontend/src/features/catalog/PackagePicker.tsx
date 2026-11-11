import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Package } from '@/api/adapters';
import { formatVnd } from '@/lib/format';
import { colors, font, radius, spacing } from '@/ui';

const TIER_LABEL = { BASIC: 'Cơ bản', STANDARD: 'Tiêu chuẩn', PREMIUM: 'Cao cấp' } as const;

export function PackagePicker({
  packages,
  selectedId,
  onSelect,
}: {
  packages: Package[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.list}>
      {packages.map((p) => {
        const selected = p.id === selectedId;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="radio"
            accessibilityLabel={`${TIER_LABEL[p.tier]} ${p.name}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(p.id)}
            style={[styles.item, selected && styles.selected]}>
            <View style={styles.head}>
              <Text style={styles.tier}>{TIER_LABEL[p.tier]}</Text>
              <Text style={styles.price}>{formatVnd(p.price)}</Text>
            </View>
            <Text style={styles.name}>{p.name}</Text>
            {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
            <Text style={styles.meta}>
              {[
                p.deliveryDays ? `Giao trong ${p.deliveryDays} ngày` : null,
                p.durationMinute ? `${p.durationMinute} phút` : null,
                p.revisionLimit ? `${p.revisionLimit} lần chỉnh sửa` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: 2, backgroundColor: colors.white },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  tier: { fontSize: font.small, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  price: { fontSize: font.body, fontWeight: '700', color: colors.primaryDark },
  name: { fontSize: font.body, fontWeight: '600', color: colors.text },
  desc: { fontSize: font.small + 1, color: colors.muted },
  meta: { fontSize: font.small, color: colors.muted },
});
