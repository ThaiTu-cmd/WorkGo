import { Text, View } from 'react-native';

import { Button } from './Button';
import { font, makeStyles, radius, spacing } from './theme';
import { useT } from '@/i18n';

export function Skeleton({ height = 72 }: { height?: number }) {
  const t = useT();
  const styles = useStyles();
  return <View accessibilityLabel={t('states.dang_tai')} style={[styles.skeleton, { height }]} />;
}

export function SkeletonList({ count = 4, height = 72 }: { count?: number; height?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </View>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT();
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t('states.khong_tai_duoc_du_lieu')}</Text>
      <Text style={styles.hint}>{message}</Text>
      {onRetry ? <Button title={t('states.thu_lai')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  skeleton: { backgroundColor: colors.border, borderRadius: radius.lg, opacity: 0.6 },
  list: { gap: spacing.md },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text, textAlign: 'center' },
  hint: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
}));
