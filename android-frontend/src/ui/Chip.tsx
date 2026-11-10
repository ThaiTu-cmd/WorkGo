import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, spacing } from './theme';

export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: font.small + 1, color: colors.text },
  textSelected: { color: colors.white, fontWeight: '600' },
});
