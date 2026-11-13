import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { CategoryDto } from '@/api/types';
import { categoryVisual, FALLBACK_VISUAL } from '@/features/catalog/categoryVisuals';
import { font, makeStyles, radius, spacing } from '@/ui';

export function CategoryGrid({ categories }: { categories: CategoryDto[] }) {
  const styles = useStyles();
  const router = useRouter();
  return (
    <View style={styles.grid}>
      {categories.slice(0, 8).map((c) => {
        const v = categoryVisual(c.slug);
        return (
          <Pressable
            key={c.categoryId}
            accessibilityRole="button"
            accessibilityLabel={c.name}
            onPress={() => router.push({ pathname: '/explore', params: { categoryId: c.categoryId, t: String(Date.now()) } })}
            style={styles.cell}>
            <View style={[styles.tile, { backgroundColor: v.bg }]}>
              <Ionicons name={v.icon} size={24} color={v.fg} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {v === FALLBACK_VISUAL ? c.name : v.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  cell: { width: '25%', alignItems: 'center', gap: spacing.xs },
  tile: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: font.small, color: colors.text, paddingHorizontal: 2 },
}));
