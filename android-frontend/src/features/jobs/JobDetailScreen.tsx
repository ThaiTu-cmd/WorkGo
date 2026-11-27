import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { jobApi, type JobDetailDto } from '@/api/jobApi';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/auth/AuthProvider';
import { formatDate, formatVnd } from '@/lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, font, makeStyles, radius, SkeletonList, spacing, useColors } from '@/ui';

export function JobDetailScreen({
  jobId: propJobId,
  onSubmitProposal,
  onReviewProposals,
}: {
  jobId?: string;
  onSubmitProposal?: (jobId: string) => void;
  onReviewProposals?: (jobId: string) => void;
} = {}) {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const activeJobId = propJobId || params.id || '';

  let currentUserId: string | undefined;
  try {
    const auth = useAuth();
    currentUserId = auth?.claims?.sub;
  } catch {
    currentUserId = undefined;
  }

  const jobQuery = useQuery({
    queryKey: qk.job(activeJobId),
    queryFn: async () => {
      const res = await jobApi.getJob(activeJobId);
      return res.result;
    },
    enabled: Boolean(activeJobId),
  });

  const job: JobDetailDto | undefined = jobQuery.data;
  const isOwner = Boolean(currentUserId && job?.clientId === currentUserId);

  const handleSubmitProposal = () => {
    if (onSubmitProposal) {
      onSubmitProposal(activeJobId);
    } else {
      router.push(`/jobs/${activeJobId}/proposal` as any);
    }
  };

  const handleReviewProposals = () => {
    if (onReviewProposals) {
      onReviewProposals(activeJobId);
    } else {
      router.push(`/jobs/${activeJobId}/review` as any);
    }
  };

  if (!activeJobId) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <EmptyState title="Không tìm thấy công việc" hint="Vui lòng kiểm tra lại đường dẫn." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {jobQuery.isPending ? (
        <View style={styles.content}>
          <SkeletonList count={4} />
        </View>
      ) : jobQuery.isError || !job ? (
        <ErrorState
          message="Không thể tải chi tiết công việc. Vui lòng thử lại."
          onRetry={() => void jobQuery.refetch()}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card style={styles.mainCard}>
            <View style={styles.metaRow}>
              <Badge
                label={job.executionType === 'DIGITAL' ? 'Trực tuyến' : 'Tại chỗ'}
                tone={job.executionType === 'DIGITAL' ? 'info' : 'warning'}
              />
              <Text style={styles.dateText}>Đăng ngày: {formatDate(job.createdAt)}</Text>
            </View>

            <Text style={styles.title}>{job.title}</Text>

            <View style={styles.budgetBox}>
              <Text style={styles.budgetLabel}>Ngân sách dự kiến</Text>
              <Text style={styles.budgetValue}>
                {job.budgetMin ? formatVnd(job.budgetMin) : 'Thoả thuận'}
                {job.budgetMax && job.budgetMax !== job.budgetMin ? ` - ${formatVnd(job.budgetMax)}` : ''}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Mô tả công việc</Text>
              <Text style={styles.descText}>{job.description}</Text>
            </View>

            {job.locationSnapshot ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Địa điểm thực hiện</Text>
                <View style={styles.inlineInfo}>
                  <Ionicons name="location-outline" size={18} color={colors.muted} />
                  <Text style={styles.infoText}>{job.locationSnapshot}</Text>
                </View>
              </View>
            ) : null}

            {job.deadlineAt ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Hạn hoàn thành</Text>
                <View style={styles.inlineInfo}>
                  <Ionicons name="time-outline" size={18} color={colors.muted} />
                  <Text style={styles.infoText}>{formatDate(job.deadlineAt)}</Text>
                </View>
              </View>
            ) : null}

            {job.client?.fullName ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Khách hàng đăng tin</Text>
                <View style={styles.inlineInfo}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.muted} />
                  <Text style={styles.infoText}>{job.client.fullName}</Text>
                </View>
              </View>
            ) : null}
          </Card>

          <View style={styles.actionSection}>
            {isOwner ? (
              <Button
                title="Xem các đề xuất đã nhận"
                variant="primary"
                onPress={handleReviewProposals}
              />
            ) : (
              <Button
                title="Ứng tuyển / Gửi đề xuất"
                variant="primary"
                onPress={handleSubmitProposal}
              />
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  scroll: { padding: spacing.md, gap: spacing.md },
  mainCard: { gap: spacing.md, borderRadius: radius.md },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: font.small, color: colors.muted },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  budgetBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 4,
  },
  budgetLabel: { fontSize: font.small, color: colors.muted },
  budgetValue: { fontSize: font.title, fontWeight: '800', color: colors.primary },
  section: { gap: spacing.xs },
  sectionHeading: { fontSize: font.body, fontWeight: '700', color: colors.text },
  descText: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  inlineInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  infoText: { fontSize: font.body, color: colors.text },
  actionSection: { gap: spacing.sm, marginTop: spacing.xs },
}));
