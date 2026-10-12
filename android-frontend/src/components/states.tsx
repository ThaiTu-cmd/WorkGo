import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  ReduceMotion,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SkeletonItem({ height = 120, style }: { height?: number; style?: object }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          height,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function LoadingSkeleton({ count = 6 }: { count?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.cardSkeletonWrapper,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SkeletonItem height={140} style={styles.cardCoverSkeleton} />
          <View style={styles.cardBodySkeleton}>
            <SkeletonItem height={16} style={{ width: '40%', marginBottom: Spacing.one }} />
            <SkeletonItem height={20} style={{ width: '85%', marginBottom: Spacing.two }} />
            <SkeletonItem height={16} style={{ width: '60%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  featuredChips?: string[];
  onChipPress?: (chip: string) => void;
}

export function EmptyState({
  title = 'Không tìm thấy kết quả',
  description = 'Thử thay đổi từ khóa hoặc bộ lọc để tìm được nhiều công việc hơn.',
  ctaLabel,
  onCtaPress,
  featuredChips = [],
  onChipPress,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.centerContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: theme.primarySubtle, borderColor: theme.border },
        ]}
      >
        <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
      </View>
      <ThemedText style={styles.stateTitle}>{title}</ThemedText>
      <ThemedText style={[styles.stateDesc, { color: theme.textSecondary }]}>
        {description}
      </ThemedText>

      {featuredChips.length > 0 && (
        <View style={styles.chipSection}>
          <ThemedText style={[styles.chipSectionLabel, { color: theme.textSecondary }]}>
            Gợi ý tìm kiếm phổ biến:
          </ThemedText>
          <View style={styles.chipRow}>
            {featuredChips.map((chip) => (
              <PressableScale
                key={chip}
                style={[
                  styles.chip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => onChipPress?.(chip)}
              >
                <ThemedText style={[styles.chipText, { color: theme.primary }]}>
                  {chip}
                </ThemedText>
              </PressableScale>
            ))}
          </View>
        </View>
      )}

      {ctaLabel && onCtaPress && (
        <PressableScale
          style={[styles.ctaButton, { backgroundColor: theme.primary }]}
          onPress={onCtaPress}
        >
          <ThemedText style={styles.ctaButtonText}>{ctaLabel}</ThemedText>
        </PressableScale>
      )}
    </View>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.',
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.centerContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.danger,
          },
        ]}
      >
        <ThemedText style={styles.emptyIcon}>⚠️</ThemedText>
      </View>
      <ThemedText style={styles.stateTitle}>Đã có lỗi xảy ra</ThemedText>
      <ThemedText style={[styles.stateDesc, { color: theme.textSecondary }]}>
        {message}
      </ThemedText>
      {onRetry && (
        <PressableScale
          style={[styles.ctaButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <ThemedText style={styles.ctaButtonText}>Thử lại</ThemedText>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    borderRadius: Radius.control,
    borderWidth: 1,
  },
  skeletonList: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardSkeletonWrapper: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cardCoverSkeleton: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
  },
  cardBodySkeleton: {
    padding: Spacing.three,
  },
  centerContainer: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  emptyIcon: {
    fontSize: 28,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  stateDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.four,
  },
  chipSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  chipSectionLabel: {
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ctaButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
