import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Text, View } from 'react-native';

import { reviewApi } from '@/api/reviewApi';
import { qk } from '@/api/queryKeys';
import type { ReviewDto } from '@/api/types';
import { formatDateTime } from '@/lib/format';
import { Avatar, Card, font, makeStyles, spacing } from '@/ui';
import { useT } from '@/i18n';

export function ServiceReviewsSection({ serviceId }: { serviceId: string }) {
  const t = useT();
  const styles = useStyles();

  const query = useQuery({
    queryKey: qk.serviceReviews(serviceId),
    queryFn: async () => (await reviewApi.getServiceReviews(serviceId)).result,
  });

  const summary = query.data;
  const reviews: ReviewDto[] = summary?.reviews?.data ?? [];

  if (query.isPending) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('reviews.danh_gia_tu_khach_hang')}</Text>
        {summary && summary.ratingCount > 0 ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.ratingText}>
              {summary.ratingAvg.toFixed(1)} ({summary.ratingCount})
            </Text>
          </View>
        ) : null}
      </View>

      {reviews.length === 0 ? (
        <Text style={styles.mutedText}>{t('reviews.chua_co_danh_gia')}</Text>
      ) : (
        reviews.slice(0, 5).map((rev) => (
          <View key={rev.reviewId} style={styles.reviewItem}>
            <View style={styles.reviewerRow}>
              <Avatar name={rev.reviewerId ? `User #${rev.reviewerId.slice(0, 4)}` : 'User'} size={32} />
              <View style={styles.reviewerInfo}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= rev.rating ? 'star' : 'star-outline'}
                      size={14}
                      color="#f59e0b"
                    />
                  ))}
                </View>
                {rev.createdAt ? (
                  <Text style={styles.dateText}>{formatDateTime(rev.createdAt)}</Text>
                ) : null}
              </View>
            </View>
            {rev.comment ? <Text style={styles.commentText}>{rev.comment}</Text> : null}
          </View>
        ))
      )}
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { gap: spacing.md, marginTop: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: font.small + 1, fontWeight: '700', color: colors.text },
  mutedText: { fontSize: font.small + 1, color: colors.muted, fontStyle: 'italic' },
  reviewItem: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewerInfo: { flex: 1, gap: 2 },
  starRow: { flexDirection: 'row', gap: 2 },
  dateText: { fontSize: font.small - 1, color: colors.muted },
  commentText: { fontSize: font.body - 1, color: colors.text, lineHeight: 20 },
}));
