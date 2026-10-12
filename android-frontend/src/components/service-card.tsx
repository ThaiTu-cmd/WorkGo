import * as React from 'react';
import { StyleSheet, View, Share } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { type MobilePostItem, type ExecutionType } from '@/api/posts';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatVND } from '@/utils/format';

export interface ServiceCardProps {
  post: MobilePostItem;
  onPress?: (id: string) => void;
}

const EXEC_CONFIG: Record<
  ExecutionType,
  { label: string; bg: string; fg: string; border: string }
> = {
  DIGITAL: {
    label: 'Kỹ thuật số',
    bg: 'rgba(2, 132, 199, 0.12)',
    fg: '#0284C7',
    border: 'rgba(2, 132, 199, 0.25)',
  },
  ONSITE: {
    label: 'Tại chỗ',
    bg: 'rgba(217, 119, 6, 0.12)',
    fg: '#D97706',
    border: 'rgba(217, 119, 6, 0.25)',
  },
  DELIVERY: {
    label: 'Giao hàng',
    bg: 'rgba(5, 150, 105, 0.12)',
    fg: '#059669',
    border: 'rgba(5, 150, 105, 0.25)',
  },
  APPOINTMENT: {
    label: 'Đặt hẹn',
    bg: 'rgba(124, 58, 237, 0.12)',
    fg: '#7C3AED',
    border: 'rgba(124, 58, 237, 0.25)',
  },
  HOURLY: {
    label: 'Theo giờ',
    bg: 'rgba(2, 132, 199, 0.12)',
    fg: '#0284C7',
    border: 'rgba(2, 132, 199, 0.25)',
  },
  PROJECT: {
    label: 'Dự án',
    bg: 'rgba(2, 132, 199, 0.12)',
    fg: '#0284C7',
    border: 'rgba(2, 132, 199, 0.25)',
  },
};

function ServiceCardInner({ post, onPress }: ServiceCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(post.postId);
    } else {
      router.push({
        pathname: '/detail',
        params: { id: post.postId },
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Xem việc làm "${post.title}" trên WorkGo: https://workgo.vn/posts/${post.postId}`,
      });
    } catch {
      // Ignored
    }
  };

  const execStyle = EXEC_CONFIG[post.executionType] ?? EXEC_CONFIG.DIGITAL;
  const coverImage = post.attachments?.[0] ?? null;

  return (
    <PressableScale
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
      onPress={handlePress}
    >
      {/* 16:10 Cover image */}
      <View style={styles.coverWrapper}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.fallbackCover,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText style={styles.fallbackIcon}>💼</ThemedText>
          </View>
        )}

        {/* Execution badge overlay */}
        <View
          style={[
            styles.execBadge,
            {
              backgroundColor: execStyle.bg,
              borderColor: execStyle.border,
            },
          ]}
        >
          <ThemedText
            style={[styles.execBadgeText, { color: execStyle.fg }]}
          >
            {execStyle.label}
          </ThemedText>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Provider info row */}
        <View style={styles.providerRow}>
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.primarySubtle },
            ]}
          >
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
              {(post.client?.name ?? 'W').charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText
            numberOfLines={1}
            style={[styles.clientName, { color: theme.textSecondary }]}
          >
            {post.client?.name ?? 'Khách hàng'}
          </ThemedText>
          <View style={styles.verifiedBadge}>
            <ThemedText style={styles.verifiedIcon}>✓</ThemedText>
          </View>
        </View>

        {/* Title */}
        <ThemedText numberOfLines={2} style={styles.title}>
          {post.title}
        </ThemedText>

        {/* Category tag */}
        {post.categoryName && (
          <View style={styles.categoryRow}>
            <ThemedText
              numberOfLines={1}
              style={[styles.categoryText, { color: theme.textSecondary }]}
            >
              🏷️ {post.categoryName}
            </ThemedText>
          </View>
        )}

        {/* Footer: Price & Proposals & Share */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.priceCol}>
            <ThemedText style={[styles.pricePrefix, { color: theme.textSecondary }]}>
              Từ
            </ThemedText>
            <ThemedText style={[styles.priceAmount, { color: theme.primary }]}>
              {formatVND(post.budgetMin)}
            </ThemedText>
          </View>

          <View style={styles.footerActions}>
            {post.proposalsCount !== undefined && post.proposalsCount > 0 && (
              <View style={styles.proposalsBadge}>
                <ThemedText style={[styles.proposalsText, { color: theme.textSecondary }]}>
                  💬 {post.proposalsCount} đề xuất
                </ThemedText>
              </View>
            )}

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Chia sẻ việc làm"
              onPress={handleShare}
              style={[
                styles.shareBtn,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.shareIcon, { color: theme.textSecondary }]}>
                ↗
              </ThemedText>
            </PressableScale>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const MemoizedServiceCard = React.memo(ServiceCardInner, (prev, next) => {
  return prev.post.postId === next.post.postId && prev.onPress === next.onPress;
});

export function ServiceCard(props: ServiceCardProps) {
  return <MemoizedServiceCard {...props} />;
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 48,
    marginBottom: Spacing.three,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  fallbackCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 40,
  },
  execBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  execBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: 2,
  },
  avatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00732E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    minHeight: 40,
  },
  categoryRow: {
    marginTop: 2,
  },
  categoryText: {
    fontSize: 12,
  },
  footer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pricePrefix: {
    fontSize: 12,
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  proposalsBadge: {
    alignItems: 'center',
  },
  proposalsText: {
    fontSize: 12,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
});
