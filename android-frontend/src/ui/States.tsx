import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, font, radius, spacing } from './theme';

export function Skeleton({ height = 72 }: { height?: number }) {
  return <View accessibilityLabel="Đang tải" style={[styles.skeleton, { height }]} />;
}

export function SkeletonList({ count = 4, height = 72 }: { count?: number; height?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </View>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Không tải được dữ liệu</Text>
      <Text style={styles.hint}>{message}</Text>
      {onRetry ? <Button title="Thử lại" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.border, borderRadius: radius.lg, opacity: 0.6 },
  list: { gap: spacing.md },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text, textAlign: 'center' },
  hint: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
});
