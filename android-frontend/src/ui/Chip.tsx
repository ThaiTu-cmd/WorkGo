import { Pressable, StyleSheet, Text } from 'react-native';

import { font, radius, spacing, useColors } from './theme';

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { borderColor: c.border, backgroundColor: selected ? c.primary : c.card }, selected && styles.selected]}>
      <Text style={[styles.text, { color: selected ? c.white : c.text }, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  selected: {},
  text: { fontSize: font.small + 1 },
  textSelected: { fontWeight: '600' },
});
