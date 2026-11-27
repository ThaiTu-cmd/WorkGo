import { StyleSheet, Text, View } from 'react-native';

import { font, radius, spacing, useColors } from './theme';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = useColors();
  const TONES: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: c.bg, fg: c.muted },
    info: { bg: c.primaryLight, fg: c.primaryDark },
    success: { bg: c.successBg, fg: c.success },
    warning: { bg: c.warningBg, fg: c.warning },
    danger: { bg: c.dangerBg, fg: c.danger },
  };
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
