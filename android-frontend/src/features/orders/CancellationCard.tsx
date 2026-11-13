import * as React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

import { cancellationErrorMessage } from '@/api/errors';
import type { CancellationDto, OrderDto, OrderRole } from '@/api/types';
import { formatDateTime } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Badge, Button, Card, font, makeStyles, OptionRow, radius, spacing, TextField } from '@/ui';

import {
  CANCEL_REASONS,
  canRespond,
  cancellationTitle,
  cancelMode,
  NOTE_MAX,
  noteError,
  noteRequired,
  reasonLabel,
  type CancelMode,
} from './cancellation';
import { useCancelOrder, useRespondCancellation } from './hooks';
import { translate, useT } from '@/i18n';

type Props = {
  order: OrderDto;
  role: OrderRole;
  // Only the fields used here, so callers pass the query result as it is.
  cancellation: { data?: CancellationDto | null; isSuccess: boolean };
};

const SIDE_LABEL: Record<OrderRole, string> = {
  get CLIENT() {
    return translate('cancellationCard.khach_hang');
  },
  get PROVIDER() {
    return translate('cancellationCard.chuyen_gia');
  },
};

export function CancellationCard({ order, role, cancellation }: Props) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const request = cancellation.data ?? null;
  // Without the query result we can't tell whether a request already exists.
  const mode = cancellation.isSuccess ? cancelMode(order, role, request) : null;

  if (request) return <RequestCard order={order} role={role} request={request} />;
  if (!mode) return null;
  return (
    <>
      <Button
        title={mode === 'immediate' ? t('cancellationCard.huy_don') : t('cancellationCard.yeu_cau_huy')}
        variant="secondary"
        onPress={() => setOpen(true)}
      />
      {open ? <CancelSheet order={order} role={role} mode={mode} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function RequestCard({ order, role, request }: { order: OrderDto; role: OrderRole; request: CancellationDto }) {
  const t = useT();
  const styles = useStyles();
  const respond = useRespondCancellation(order);
  const once = useSingleFlight();
  const [error, setError] = React.useState<string | null>(null);
  const [answer, setAnswer] = React.useState<boolean | null>(null);

  const send = (accept: boolean) => {
    setError(null);
    setAnswer(accept);
    void once(() => respond.mutateAsync(accept).catch((err) => setError(cancellationErrorMessage(err))));
  };

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text style={styles.section}>{cancellationTitle(request.status)}</Text>
        {request.status === 'PENDING' ? <Badge label={t('cancellationCard.cho_phan_hoi')} tone="warning" /> : null}
      </View>
      <Line label={t('cancellationCard.nguoi_gui')} value={SIDE_LABEL[request.requestedByRole]} />
      <Line label={t('cancellationCard.ly_do')} value={reasonLabel(request.reasonCode)} />
      {request.note ? <Text style={styles.text}>{request.note}</Text> : null}
      <Line label={t('cancellationCard.thoi_gian')} value={formatDateTime(request.createdAt)} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {canRespond(request, role) ? (
        <View style={styles.actions}>
          <Button
            title={t('cancellationCard.tu_choi_huy_don')}
            variant="secondary"
            style={styles.flex}
            loading={respond.isPending && answer === false}
            disabled={respond.isPending}
            onPress={() => send(false)}
          />
          <Button
            title={t('cancellationCard.dong_y_huy_don')}
            variant="danger"
            style={styles.flex}
            loading={respond.isPending && answer === true}
            disabled={respond.isPending}
            onPress={() => send(true)}
          />
        </View>
      ) : request.status === 'PENDING' ? (
        <Text style={styles.muted}>{t('cancellationCard.dang_cho_ben_con_lai')}</Text>
      ) : null}
    </Card>
  );
}

function CancelSheet({ order, role, mode, onClose }: { order: OrderDto; role: OrderRole; mode: CancelMode; onClose: () => void }) {
  const t = useT();
  const styles = useStyles();
  const cancel = useCancelOrder(order);
  const once = useSingleFlight();
  const [reasonCode, setReasonCode] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const required = noteRequired(mode, reasonCode);
  const invalidNote = noteError(mode, reasonCode, note);

  const submit = () => {
    setError(null);
    void once(() =>
      cancel
        .mutateAsync({ reasonCode, note: note.trim() || undefined })
        .then(onClose)
        .catch((err) => setError(cancellationErrorMessage(err))),
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            {mode === 'immediate' ? t('cancellationCard.huy_don_hang') : t('cancellationCard.yeu_cau_huy_don_hang')}
          </Text>
          <Text style={styles.muted}>
            {mode === 'immediate' ? t('cancellationCard.don_chua_thanh_toan_nen') : t('cancellationCard.don_da_thanh_toan_nen')}
          </Text>
          <Text style={styles.label}>{t('cancellationCard.ly_do')}</Text>
          {CANCEL_REASONS[role].map((r) => (
            <OptionRow key={r.code} kind="radio" label={r.label} selected={reasonCode === r.code} onPress={() => setReasonCode(r.code)} />
          ))}
          <TextField
            label={required ? t('cancellationCard.ghi_chu_bat_buoc') : t('cancellationCard.ghi_chu_khong_bat_buoc')}
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX}
            multiline
            error={note.length > 0 ? (invalidNote ?? undefined) : undefined}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title={mode === 'immediate' ? t('cancellationCard.xac_nhan_huy_don') : t('cancellationCard.gui_yeu_cau_huy')}
            variant="danger"
            loading={cancel.isPending}
            disabled={!reasonCode || invalidNote !== null}
            onPress={submit}
          />
          <Button title={t('cancellationCard.dong')} variant="secondary" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text, flexShrink: 1 },
  text: { fontSize: font.body, color: colors.text, flexShrink: 1 },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
  error: { fontSize: font.body, color: colors.danger },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { flexGrow: 0, maxHeight: '90%', backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  sheetBody: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
}));
