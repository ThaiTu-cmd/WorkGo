import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { instantToTime, timeToInstant, timeToMinutes, WEEK_DAYS } from '@/api/availabilityApi';
import { errorMessage } from '@/api/errors';
import type { RuleDto } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatDateTime } from '@/lib/format';
import { Badge, Button, Card, Chip, colors, EmptyState, ErrorState, font, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { isForbidden, useDeleteRule, useRules, useSaveRule, useSlots } from './hooks';
import { NotProviderNotice } from './NotProviderNotice';

type Draft = { ruleId: string | null; dayOfWeek: number; start: string; end: string; duration: string };
const NEW_RULE: Draft = { ruleId: null, dayOfWeek: 2, start: '08:00', end: '17:00', duration: '60' };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateRule(d: Draft): string | null {
  if (!HHMM.test(d.start) || !HHMM.test(d.end)) return 'Giờ theo dạng HH:mm, ví dụ 08:30.';
  if (timeToMinutes(d.end) <= timeToMinutes(d.start)) return 'Giờ kết thúc phải sau giờ bắt đầu.';
  const duration = Number(d.duration);
  if (!Number.isInteger(duration) || duration < 15) return 'Thời lượng mỗi lượt tối thiểu 15 phút.';
  if (duration > timeToMinutes(d.end) - timeToMinutes(d.start)) return 'Thời lượng dài hơn khung giờ.';
  return null;
}

const dayLabel = (v: number) => WEEK_DAYS.find((d) => d.value === v)?.label ?? `Thứ ${v}`;

export function AvailabilityScreen() {
  const signedIn = useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rules = useRules(id, signedIn);
  const slots = useSlots(id, signedIn);
  const saveRule = useSaveRule(id);
  const deleteRule = useDeleteRule(id);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!signedIn) return <LoginRequired edges={['bottom']} />;

  const edit = (r: RuleDto) =>
    setDraft({
      ruleId: r.availableRuleId,
      dayOfWeek: r.dayOfWeek,
      start: instantToTime(r.startTime),
      end: instantToTime(r.endTime),
      duration: String(r.slotDurationMinute),
    });

  const submit = () => {
    if (!draft) return;
    const issue = validateRule(draft);
    if (issue) return setError(issue);
    setError(null);
    saveRule.mutate(
      {
        ruleId: draft.ruleId,
        body: {
          dayOfWeek: draft.dayOfWeek,
          startTime: timeToInstant(draft.start),
          endTime: timeToInstant(draft.end),
          slotDurationMinute: Number(draft.duration),
          status: 'ACTIVE',
        },
      },
      { onSuccess: () => setDraft(null), onError: (err) => setError(errorMessage(err)) }
    );
  };

  if (rules.isError && isForbidden(rules.error)) {
    return (
      <Screen edges={['bottom']}>
        <NotProviderNotice onRefreshed={() => void rules.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['bottom']}
      onRefresh={() => {
        void rules.refetch();
        void slots.refetch();
      }}
      refreshing={rules.isRefetching}>
      <Text style={styles.section}>Khung giờ nhận việc</Text>
      {rules.isPending ? (
        <SkeletonList count={2} height={70} />
      ) : rules.isError ? (
        <ErrorState message={errorMessage(rules.error)} onRetry={() => void rules.refetch()} />
      ) : rules.data.length === 0 ? (
        <EmptyState title="Chưa có khung giờ" hint="Thêm khung giờ để khách chọn lịch hẹn." />
      ) : (
        rules.data.map((r) => (
          <Card key={r.availableRuleId}>
            <View style={styles.row}>
              <Text style={styles.title}>{dayLabel(r.dayOfWeek)}</Text>
              {r.status === 'INACTIVE' ? <Badge label="Tắt" /> : null}
            </View>
            <Text style={styles.text}>
              {instantToTime(r.startTime)} – {instantToTime(r.endTime)} · mỗi lượt {r.slotDurationMinute} phút
            </Text>
            <View style={styles.row}>
              <Button title="Sửa" variant="secondary" style={styles.flex} onPress={() => edit(r)} />
              <Button
                title="Xoá"
                variant="secondary"
                style={styles.flex}
                onPress={() =>
                  Alert.alert('Xoá khung giờ', `Xoá khung giờ ${dayLabel(r.dayOfWeek)}?`, [
                    { text: 'Huỷ', style: 'cancel' },
                    {
                      text: 'Xoá',
                      style: 'destructive',
                      onPress: () =>
                        deleteRule.mutate(r.availableRuleId, { onError: (err) => Alert.alert('Không xoá được', errorMessage(err)) }),
                    },
                  ])
                }
              />
            </View>
          </Card>
        ))
      )}

      {draft ? (
        <Card>
          <Text style={styles.title}>{draft.ruleId ? 'Sửa khung giờ' : 'Khung giờ mới'}</Text>
          <View style={styles.wrap}>
            {WEEK_DAYS.map((d) => (
              <Chip key={d.value} label={d.short} selected={draft.dayOfWeek === d.value} onPress={() => setDraft({ ...draft, dayOfWeek: d.value })} />
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label="Bắt đầu" value={draft.start} onChangeText={(start) => setDraft({ ...draft, start })} />
            </View>
            <View style={styles.flex}>
              <TextField label="Kết thúc" value={draft.end} onChangeText={(end) => setDraft({ ...draft, end })} />
            </View>
          </View>
          <TextField label="Mỗi lượt (phút)" keyboardType="number-pad" value={draft.duration} onChangeText={(duration) => setDraft({ ...draft, duration })} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <Button title="Huỷ" variant="secondary" style={styles.flex} onPress={() => setDraft(null)} />
            <Button title="Lưu" style={styles.flex} loading={saveRule.isPending} onPress={submit} />
          </View>
        </Card>
      ) : (
        <Button title="Thêm khung giờ" onPress={() => setDraft(NEW_RULE)} />
      )}

      <Text style={styles.section}>Lịch sắp tới</Text>
      {slots.isPending ? (
        <SkeletonList count={2} height={48} />
      ) : (slots.data ?? []).length === 0 ? (
        <Text style={styles.muted}>Chưa có lượt nào. Hệ thống tạo lượt từ các khung giờ ở trên.</Text>
      ) : (
        (slots.data ?? []).slice(0, 20).map((s) => (
          <View key={s.bookingSlotId} style={styles.slot}>
            <Text style={styles.text}>{formatDateTime(s.startedAt)}</Text>
            <Badge label={s.status === 'AVAILABLE' ? 'Trống' : s.status === 'BOOKED' ? 'Đã đặt' : s.status === 'HELD' ? 'Đang giữ' : 'Khoá'} tone={s.status === 'AVAILABLE' ? 'success' : 'neutral'} />
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  flex: { flex: 1 },
  slot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  error: { fontSize: font.body, color: colors.danger },
});
