import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonItem, EmptyState } from '@/components/states';
import { ProposalSheet } from '@/components/proposal-sheet';
import { postsApi, type MobilePostItem, type ExecutionType } from '@/api/posts';
import { proposalsApi, type MobileProposalInput } from '@/api/proposals';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/toast';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatVND } from '@/utils/format';

const EXEC_CONFIG: Record<
  ExecutionType,
  { label: string; bg: string; fg: string; border: string }
> = {
  DIGITAL: { label: 'Kỹ thuật số', bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
  ONSITE: { label: 'Tại chỗ', bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A' },
  DELIVERY: { label: 'Giao hàng', bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0' },
  APPOINTMENT: { label: 'Đặt hẹn', bg: '#F3E8FF', fg: '#6D28D9', border: '#DDD6FE' },
  HOURLY: { label: 'Theo giờ', bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
  PROJECT: { label: 'Dự án', bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
};

export default function DetailScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = React.useState<MobilePostItem | null>(null);
  const [loading, setLoading] = React.useState(Boolean(id));
  const [applied, setApplied] = React.useState(false);
  const toast = useToast();
  const [hasApplied, setHasApplied] = React.useState(false);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [proposalError, setProposalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      return;
    }
    let active = true;
    postsApi
      .get(id)
      .then((data) => {
        if (active) {
          setPost(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });

    // Check application status if user is authenticated
    if (session) {
      proposalsApi.hasApplied(id).then((already) => {
        if (active) {
          setHasApplied(already);
          if (already) setApplied(true);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [id, session]);

  const handleApply = () => {
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    if (hasApplied || applied) {
      return;
    }
    setProposalError(null);
    setSheetVisible(true);
  };

  const handleProposalSubmit = async (input: MobileProposalInput) => {
    if (!id) return;
    try {
      setSubmitting(true);
      setProposalError(null);
      await proposalsApi.submit(id, input);
      setApplied(true);
      setHasApplied(true);
      setSheetVisible(false);
      toast.show('Đã gửi đề xuất thành công!', 'success');
    } catch (err: unknown) {
      let errMsg = 'Không thể gửi đề xuất. Vui lòng thử lại sau.';
      if (err && typeof err === 'object' && 'messageVi' in err) {
        errMsg = (err as { messageVi: string }).messageVi;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setProposalError(errMsg);
      toast.show(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const execStyle = post ? EXEC_CONFIG[post.executionType] ?? EXEC_CONFIG.DIGITAL : EXEC_CONFIG.DIGITAL;
  const coverImage = post?.attachments?.[0] ?? null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            accessibilityHint="Quay lại màn hình danh sách công việc"
            style={[
              styles.backBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/catalog'))}
          >
            <ThemedText style={styles.backBtnText}>←</ThemedText>
          </PressableScale>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            Chi tiết công việc
          </ThemedText>
          <View style={styles.headerPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.loadingPadding}>
            <SkeletonItem height={220} style={{ marginBottom: Spacing.three }} />
            <SkeletonItem height={28} style={{ width: '80%', marginBottom: Spacing.two }} />
            <SkeletonItem height={20} style={{ width: '50%', marginBottom: Spacing.four }} />
            <SkeletonItem height={100} style={{ marginBottom: Spacing.four }} />
          </View>
        ) : !post ? (
          <EmptyState
            title="Công việc không tồn tại"
            description="Tin tuyển dụng này có thể đã kết thúc hoặc bị gỡ bỏ."
            ctaLabel="Quay lại danh sách"
            onCtaPress={() => (router.canGoBack() ? router.back() : router.replace('/catalog'))}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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

              <View
                style={[
                  styles.execBadge,
                  {
                    backgroundColor: execStyle.bg,
                    borderColor: execStyle.border,
                  },
                ]}
              >
                <ThemedText style={[styles.execBadgeText, { color: execStyle.fg }]}>
                  {execStyle.label}
                </ThemedText>
              </View>
            </View>

            {/* Post Title & Category */}
            <View style={styles.section}>
              {post.categoryName && (
                <ThemedText style={[styles.categoryTag, { color: theme.primary }]}>
                  {post.categoryName}
                </ThemedText>
              )}
              <ThemedText type="subtitle" style={styles.title}>
                {post.title}
              </ThemedText>
            </View>

            {/* Provider row */}
            <View
              style={[
                styles.clientCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.clientAvatar,
                  { backgroundColor: theme.primarySubtle },
                ]}
              >
                <ThemedText style={[styles.clientAvatarText, { color: theme.primary }]}>
                  {(post.client?.name ?? 'W').charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.clientMeta}>
                <View style={styles.clientNameRow}>
                  <ThemedText style={styles.clientName}>
                    {post.client?.name ?? 'Người đăng việc'}
                  </ThemedText>
                  <View style={styles.verifiedBadge}>
                    <ThemedText style={styles.verifiedIcon}>✓</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.clientSub, { color: theme.textSecondary }]}>
                  ⭐ {post.client?.ratingAvg ? post.client.ratingAvg.toFixed(1) : '5.0'} • Phản hồi{' '}
                  {post.client?.responseTime ?? 'trong 1 giờ'}
                </ThemedText>
              </View>
            </View>

            {/* Escrow Trust Guarantee Card */}
            <ThemedView
              style={[
                styles.escrowCard,
                { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
              ]}
            >
              <ThemedText style={styles.escrowTitle}>🛡️ Bảo chứng thanh toán Escrow</ThemedText>
              <ThemedText style={styles.escrowDesc}>
                Ngân sách công việc được ký quỹ an toàn tại WorkGo. Bạn sẽ nhận thanh toán ngay sau
                khi đối tác nghiệm thu hoàn tất sản phẩm.
              </ThemedText>
            </ThemedView>

            {/* Description */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionHeading}>Mô tả công việc</ThemedText>
              <ThemedText style={[styles.descText, { color: theme.textSecondary }]}>
                {post.description}
              </ThemedText>
            </View>

            {/* Deadline & Location info */}
            {(post.deadlineAt || post.locationSnapshot) && (
              <View
                style={[
                  styles.metaBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                {post.deadlineAt && (
                  <View style={styles.metaRow}>
                    <ThemedText style={styles.metaLabel}>Hạn hoàn thành:</ThemedText>
                    <ThemedText style={styles.metaVal}>
                      {new Date(post.deadlineAt).toLocaleDateString('vi-VN')}
                    </ThemedText>
                  </View>
                )}
                {post.locationSnapshot && (
                  <View style={styles.metaRow}>
                    <ThemedText style={styles.metaLabel}>Địa điểm:</ThemedText>
                    <ThemedText style={styles.metaVal}>{post.locationSnapshot}</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionHeading}>Tài liệu đính kèm</ThemedText>
                <View style={styles.attachmentList}>
                  {post.attachments.map((att, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.attachmentItem,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      ]}
                    >
                      <ThemedText style={styles.attachmentIcon}>📎</ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.attachmentName, { color: theme.textSecondary }]}
                      >
                        {att}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Sticky Action Bar */}
        {post && (
          <View
            style={[
              styles.bottomBar,
              { backgroundColor: theme.surface, borderTopColor: theme.border },
            ]}
          >
            <View style={styles.budgetCol}>
              <ThemedText style={[styles.budgetLabel, { color: theme.textSecondary }]}>
                Ngân sách
              </ThemedText>
              <ThemedText style={[styles.budgetValue, { color: theme.primary }]}>
                {formatVND(post.budgetMin)}
              </ThemedText>
            </View>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={(hasApplied || applied) ? 'Đã gửi đề xuất' : 'Gửi báo giá'}
              accessibilityHint="Mở biểu mẫu gửi báo giá cho công việc này"
              style={[
                styles.applyBtn,
                {
                  backgroundColor: (hasApplied || applied) ? '#15803D' : theme.primary,
                },
              ]}
              onPress={handleApply}
              disabled={hasApplied || applied}
            >
              <ThemedText style={styles.applyBtnText}>
                {(hasApplied || applied) ? '✓ Đã gửi đề xuất' : 'Gửi báo giá'}
              </ThemedText>
            </PressableScale>
          </View>
        )}

        {/* Proposal Bottom Sheet */}
        {post && (
          <ProposalSheet
            visible={sheetVisible}
            postId={post.postId}
            budgetMax={post.budgetMax}
            hasApplied={hasApplied || applied}
            isProvider={session?.role === 'PROVIDER'}
            submitting={submitting}
            error={proposalError}
            onClose={() => setSheetVisible(false)}
            onSubmit={handleProposalSubmit}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: 220,
  },
  headerPlaceholder: {
    width: 38,
  },
  loadingPadding: {
    padding: Spacing.four,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.seven,
    gap: Spacing.four,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: Radius.card,
    overflow: 'hidden',
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
    fontSize: 48,
  },
  execBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  execBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.one,
  },
  categoryTag: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1,
    gap: Spacing.three,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  clientMeta: {
    flex: 1,
    gap: 2,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#00732E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  clientSub: {
    fontSize: 12,
  },
  escrowCard: {
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1,
    gap: Spacing.one,
  },
  escrowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  escrowDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1E3A8A',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },
  metaBox: {
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentList: {
    gap: Spacing.two,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Radius.control,
    borderWidth: 1,
    gap: Spacing.two,
  },
  attachmentIcon: {
    fontSize: 16,
  },
  attachmentName: {
    fontSize: 13,
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  budgetCol: {
    gap: 2,
  },
  budgetLabel: {
    fontSize: 12,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  applyBtn: {
    height: 48,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
