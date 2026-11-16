import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';

import { font, makeStyles, radius, spacing, useColors } from './theme';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }: Props) {
  const styles = useStyles();
  const c = useColors();
  const inactive = disabled || loading;
  const variantStyle =
    variant === 'primary'
      ? { backgroundColor: c.primary }
      : variant === 'secondary'
      ? { backgroundColor: c.card, borderWidth: 1, borderColor: c.border }
      : { backgroundColor: c.danger };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.base, variantStyle, inactive && styles.inactive, pressed && styles.pressed, style]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? c.text : c.white} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && { color: c.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { color: colors.white, fontSize: font.body, fontWeight: '600' },
}));
