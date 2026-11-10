import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { radius, spacing, useColors } from './theme';

type Props = { children: React.ReactNode; onPress?: () => void; style?: ViewStyle; accessibilityLabel?: string };

export function Card({ children, onPress, style, accessibilityLabel }: Props) {
  const c = useColors();
  if (!onPress) return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: c.card, borderColor: c.border }, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
});
