import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Alert, Text, View } from 'react-native';

import { instantToTime, timeToInstant, timeToMinutes, WEEK_DAYS } from '@/api/availabilityApi';
import { catalogErrorMessage, errorMessage } from '@/api/errors';
import type { RuleDto } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatDateTime } from '@/lib/format';
import { Badge, Button, Card, Chip, EmptyState, ErrorState, font, makeStyles, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { isForbidden, useDeleteRule, useRules, useSaveRule, useSlots } from './hooks';
import { NotProviderNotice } from './NotProviderNotice';
import { translate, useT } from '@/i18n';

type Draft = { ruleId: string | null; dayOfWeek: number; start: string; end: string; duration: string };
const NEW_RULE: Draft = { ruleId: null, dayOfWeek: 2, start: '08:00', end: '17:00', duration: '60' };
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateRule(d: Draft): string | null {
  if (!HHMM.test(d.start) || !HHMM.test(d.end)) return translate('availabilityScreen.gio_theo_dang_hh_mm');
  if (timeToMinutes(d.end) <= timeToMinutes(d.start)) return translate('availabilityScreen.gio_ket_thuc_phai_sau');
  const duration = Number(d.duration);
  if (!Number.isInteger(duration) || duration < 15) return translate('availabilityScreen.thoi_luong_moi_luot_toi');
  if (duration > timeToMinutes(d.end) - timeToMinutes(d.start)) return translate('availabilityScreen.thoi_luong_dai_hon_khung');
  return null;
}

const dayLabel = (v: number) => WEEK_DAYS.find((d) => d.value === v)?.label ?? translate('availabilityScreen.thu', { p0: v });

export function AvailabilityScreen() {
  const t = useT();
  const styles = useStyles();
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
      { onSuccess: () => setDraft(null), onError: (err) => setError(catalogErrorMessage(err)) }
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
      <Text style={styles.section}>{t('availabilityScreen.khung_gio_nhan_viec')}</Text>
      {rules.isPending ? (
        <SkeletonList count={2} height={70} />
      ) : rules.isError ? (
        <ErrorState message={errorMessage(rules.error)} onRetry={() => void rules.refetch()} />
      ) : rules.data.length === 0 ? (
        <EmptyState title={t('availabilityScreen.chua_co_khung_gio')} hint={t('availabilityScreen.them_khung_gio_de_khach')} />
      ) : (
        rules.data.map((r) => (
          <Card key={r.availableRuleId}>
            <View style={styles.row}>
              <Text style={styles.title}>{dayLabel(r.dayOfWeek)}</Text>
              {r.status === 'INACTIVE' ? <Badge label={t('availabilityScreen.tat')} /> : null}
            </View>
            <Text style={styles.text}>{t('availabilityScreen.moi_luot_phut', { p0: instantToTime(r.startTime), p1: instantToTime(r.endTime), p2: r.slotDurationMinute })}</Text>
            <View style={styles.row}>
              <Button title={t('availabilityScreen.sua')} variant="secondary" style={styles.flex} onPress={() => edit(r)} />
              <Button
                title={t('availabilityScreen.xoa')}
                variant="secondary"
                style={styles.flex}
                onPress={() =>
                  Alert.alert(t('availabilityScreen.xoa_khung_gio'), t('availabilityScreen.xoa_khung_gio_2', { p0: dayLabel(r.dayOfWeek) }), [
                    { text: t('availabilityScreen.huy'), style: 'cancel' },
                    {
                      text: t('availabilityScreen.xoa'),
                      style: 'destructive',
                      onPress: () =>
                        deleteRule.mutate(r.availableRuleId, { onError: (err) => Alert.alert(t('availabilityScreen.khong_xoa_duoc'), catalogErrorMessage(err)) }),
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
          <Text style={styles.title}>{draft.ruleId ? t('availabilityScreen.sua_khung_gio') : t('availabilityScreen.khung_gio_moi')}</Text>
          <View style={styles.wrap}>
            {WEEK_DAYS.map((d) => (
              <Chip key={d.value} label={d.short} selected={draft.dayOfWeek === d.value} onPress={() => setDraft({ ...draft, dayOfWeek: d.value })} />
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label={t('availabilityScreen.bat_dau')} value={draft.start} onChangeText={(start) => setDraft({ ...draft, start })} />
            </View>
            <View style={styles.flex}>
              <TextField label={t('availabilityScreen.ket_thuc')} value={draft.end} onChangeText={(end) => setDraft({ ...draft, end })} />
            </View>
          </View>
          <TextField label={t('availabilityScreen.moi_luot_phut_2')} keyboardType="number-pad" value={draft.duration} onChangeText={(duration) => setDraft({ ...draft, duration })} />
          <Text style={styles.muted}>{t('availabilityScreen.luu_khung_gio_se_tu')}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.row}>
            <Button title={t('availabilityScreen.huy')} variant="secondary" style={styles.flex} onPress={() => setDraft(null)} />
            <Button title={t('availabilityScreen.luu')} style={styles.flex} loading={saveRule.isPending} onPress={submit} />
          </View>
        </Card>
      ) : (
        <Button title={t('availabilityScreen.them_khung_gio')} onPress={() => setDraft(NEW_RULE)} />
      )}

      <Text style={styles.section}>{t('availabilityScreen.lich_sap_toi')}</Text>
      {slots.isPending ? (
        <SkeletonList count={2} height={48} />
      ) : (slots.data ?? []).length === 0 ? (
        <Text style={styles.muted}>{t('availabilityScreen.chua_co_luot_nao_he')}</Text>
      ) : (
        (slots.data ?? []).slice(0, 20).map((s) => (
          <View key={s.bookingSlotId} style={styles.slot}>
            <Text style={styles.text}>{formatDateTime(s.startedAt)}</Text>
            <Badge label={s.status === 'AVAILABLE' ? t('availabilityScreen.trong') : s.status === 'BOOKED' ? t('availabilityScreen.da_dat') : s.status === 'HELD' ? t('availabilityScreen.dang_giu') : t('availabilityScreen.khoa')} tone={s.status === 'AVAILABLE' ? 'success' : 'neutral'} />
          </View>
        ))
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  title: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  flex: { flex: 1 },
  slot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  error: { fontSize: font.body, color: colors.danger },
}));
