import { Pressable, Text, View } from 'react-native';

import type { Package } from '@/api/adapters';
import { formatVnd } from '@/lib/format';
import { font, makeStyles, radius, spacing } from '@/ui';
import { translate, useT } from '@/i18n';

const TIER_LABEL = {
  get BASIC() {
    return translate('packagePicker.co_ban');
  },
  get STANDARD() {
    return translate('packagePicker.tieu_chuan');
  },
  get PREMIUM() {
    return translate('packagePicker.cao_cap');
  },
} as const;

export function PackagePicker({
  packages,
  selectedId,
  onSelect,
}: {
  packages: Package[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const styles = useStyles();
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
                p.deliveryDays ? t('packagePicker.giao_trong_ngay', { p0: p.deliveryDays }) : null,
                p.durationMinute ? t('packagePicker.phut', { p0: p.durationMinute }) : null,
                p.revisionLimit ? t('packagePicker.lan_chinh_sua', { p0: p.revisionLimit }) : null,
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

const useStyles = makeStyles((colors) => ({
  list: { gap: spacing.sm },
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: 2, backgroundColor: colors.card },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  tier: { fontSize: font.small, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  price: { fontSize: font.body, fontWeight: '700', color: colors.primaryDark },
  name: { fontSize: font.body, fontWeight: '600', color: colors.text },
  desc: { fontSize: font.small + 1, color: colors.muted },
  meta: { fontSize: font.small, color: colors.muted },
}));
