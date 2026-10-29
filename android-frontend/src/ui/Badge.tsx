import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from './theme';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#f3f4f6', fg: colors.muted },
  info: { bg: '#dbeafe', fg: colors.info },
  success: { bg: '#dcfce7', fg: colors.primaryDark },
  warning: { bg: '#fef3c7', fg: colors.warning },
  danger: { bg: '#fee2e2', fg: colors.danger },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  text: { fontSize: font.small, fontWeight: '600' },
});
