import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { reviewApi } from '@/api/reviewApi';
import { qk } from '@/api/queryKeys';
import type { OrderReviewStatusDto } from '@/api/types';
import { errorMessage } from '@/api/errors';
import { Badge, Button, Card, font, makeStyles, spacing, TextField, useColors } from '@/ui';
import { useT } from '@/i18n';

export function OrderReviewCard({ orderId, serviceId }: { orderId: string; serviceId?: string }) {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const queryClient = useQueryClient();

  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState<string>('');

  const statusQuery = useQuery({
    queryKey: qk.orderReviewStatus(orderId),
    queryFn: async () => (await reviewApi.getOrderReviewStatus(orderId)).result,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return reviewApi.submitReview({
        orderId,
        rating,
        comment: comment.trim() || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.orderReviewStatus(orderId) });
      if (serviceId) {
        void queryClient.invalidateQueries({ queryKey: qk.serviceReviews(serviceId) });
      }
      Alert.alert(t('reviews.danh_gia_thanh_cong'));
    },
    onError: (err) => {
      Alert.alert(errorMessage(err));
    },
  });

  const reviewStatus: OrderReviewStatusDto | undefined = statusQuery.data;

  if (statusQuery.isPending) {
    return null;
  }

  // If already submitted:
  if (reviewStatus?.myReviewSubmitted && reviewStatus.myReview) {
    const rev = reviewStatus.myReview;
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('reviews.danh_gia_dich_vu')}</Text>
          <Badge label={t('reviews.ban_da_danh_gia')} tone="success" />
        </View>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= rev.rating ? 'star' : 'star-outline'}
              size={20}
              color={colors.star}
            />
          ))}
          <Text style={styles.ratingLabel}>{rev.rating} / 5</Text>
        </View>
        {rev.comment ? <Text style={styles.commentDisplay}>{rev.comment}</Text> : null}
      </Card>
    );
  }

  // If not submitted yet:
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('reviews.danh_gia_dich_vu')}</Text>
      <Text style={styles.instruction}>{t('reviews.chon_so_sao')}</Text>
      <View style={styles.interactiveStarRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={`${s} ${t('reviews.sao')}`}
            hitSlop={8}
            onPress={() => setRating(s)}
            style={styles.starTouch}>
            <Ionicons
              name={s <= rating ? 'star' : 'star-outline'}
              size={28}
              color={colors.star}
            />
          </Pressable>
        ))}
      </View>
      <TextField
        label={t('reviews.nhan_xet_cua_ban')}
        value={comment}
        onChangeText={setComment}
        placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
        multiline
        numberOfLines={3}
      />
      <Button
        title={t('reviews.gui_danh_gia')}
        loading={submitMutation.isPending}
        onPress={() => submitMutation.mutate()}
      />
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { gap: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  instruction: { fontSize: font.small, color: colors.muted },
  interactiveStarRow: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xs },
  starTouch: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingLabel: { fontSize: font.small + 1, fontWeight: '700', color: colors.text, marginLeft: spacing.xs },
  commentDisplay: { fontSize: font.body, color: colors.text, marginTop: spacing.xs, fontStyle: 'italic' },
}));
