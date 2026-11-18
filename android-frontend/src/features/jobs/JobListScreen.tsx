import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { jobApi, type JobExecutionType, type JobSummaryDto } from '@/api/jobApi';
import { qk } from '@/api/queryKeys';
import { formatVnd } from '@/lib/format';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, font, makeStyles, radius, SkeletonList, spacing, TextField } from '@/ui';

export function JobListScreen({
  onSelectJob,
  onCreateJob,
}: {
  onSelectJob?: (jobId: string) => void;
  onCreateJob?: () => void;
} = {}) {
  const styles = useStyles();
  const router = useRouter();

  const [keyword, setKeyword] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<JobExecutionType | 'ALL'>('ALL');

  const jobsQuery = useQuery({
    queryKey: qk.jobs({ keyword: keyword.trim() || undefined, executionType: typeFilter !== 'ALL' ? typeFilter : undefined }),
    queryFn: async () => {
      const res = await jobApi.searchJobs({
        keyword: keyword.trim() || undefined,
        executionType: typeFilter !== 'ALL' ? typeFilter : undefined,
        page: 0,
        size: 50,
      });
      return res.result?.data ?? [];
    },
  });

  const jobs: JobSummaryDto[] = jobsQuery.data ?? [];

  const handleOpenDetail = (jobId: string) => {
    if (onSelectJob) {
      onSelectJob(jobId);
    } else {
      router.push(`/jobs/${jobId}` as any);
    }
  };

  const handleCreateJob = () => {
    if (onCreateJob) {
      onCreateJob();
    } else {
      router.push('/jobs/new' as any);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Sàn Việc Làm</Text>
          <Button
            title="Đăng việc"
            onPress={handleCreateJob}
          />
        </View>

        <TextField
          label="Tìm kiếm"
          placeholder="Tìm kiếm công việc..."
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
        />

        <View style={styles.chipRow}>
          <Chip label="Tất cả" selected={typeFilter === 'ALL'} onPress={() => setTypeFilter('ALL')} />
          <Chip label="Trực tuyến" selected={typeFilter === 'DIGITAL'} onPress={() => setTypeFilter('DIGITAL')} />
          <Chip label="Tại chỗ" selected={typeFilter === 'ONSITE'} onPress={() => setTypeFilter('ONSITE')} />
        </View>
      </View>

      {jobsQuery.isPending ? (
        <View style={styles.content}>
          <SkeletonList count={4} />
        </View>
      ) : jobsQuery.isError ? (
        <ErrorState
          message="Không thể tải danh sách việc làm. Vui lòng thử lại."
          onRetry={() => void jobsQuery.refetch()}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Chưa có việc làm nào phù hợp"
          hint="Hãy thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm thêm công việc."
          action={<Button title="Tải lại" variant="secondary" onPress={() => void jobsQuery.refetch()} />}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.jobId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={jobsQuery.isRefetching}
              onRefresh={() => void jobsQuery.refetch()}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => handleOpenDetail(item.jobId)}
            >
              <Card style={styles.jobCard}>
                <View style={styles.cardHeader}>
                  <Badge
                    label={item.executionType === 'DIGITAL' ? 'Trực tuyến' : 'Tại chỗ'}
                    tone={item.executionType === 'DIGITAL' ? 'info' : 'warning'}
                  />
                  <Text style={styles.statusLabel}>
                    {item.status === 'OPEN' ? 'Đang nhận đề xuất' : item.status}
                  </Text>
                </View>

                <Text style={styles.jobTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.description ? (
                  <Text style={styles.jobDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.budget}>
                    {item.budgetMin ? formatVnd(item.budgetMin) : 'Thoả thuận'}
                    {item.budgetMax && item.budgetMax !== item.budgetMin ? ` - ${formatVnd(item.budgetMax)}` : ''}
                  </Text>
                  <Text style={styles.appCount}>
                    {item.applicationCount ?? 0} đề xuất
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  content: { padding: spacing.md },
  list: { padding: spacing.md, gap: spacing.sm },
  jobCard: { gap: spacing.xs, borderRadius: radius.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: font.small - 1, color: colors.muted, fontWeight: '600' },
  jobTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  jobDesc: { fontSize: font.small, color: colors.muted, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  budget: { fontSize: font.body, fontWeight: '700', color: colors.primary },
  appCount: { fontSize: font.small, color: colors.muted },
}));
