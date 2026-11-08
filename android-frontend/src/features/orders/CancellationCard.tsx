import * as React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cancellationErrorMessage } from '@/api/errors';
import type { CancellationDto, OrderDto, OrderRole } from '@/api/types';
import { formatDateTime } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Badge, Button, Card, colors, font, OptionRow, radius, spacing, TextField } from '@/ui';

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

type Props = {
  order: OrderDto;
  role: OrderRole;
  // Only the fields used here, so callers pass the query result as it is.
  cancellation: { data?: CancellationDto | null; isSuccess: boolean };
};

const SIDE_LABEL: Record<OrderRole, string> = { CLIENT: 'Khách hàng', PROVIDER: 'Chuyên gia' };

export function CancellationCard({ order, role, cancellation }: Props) {
  const [open, setOpen] = React.useState(false);
  const request = cancellation.data ?? null;
  // Without the query result we can't tell whether a request already exists.
  const mode = cancellation.isSuccess ? cancelMode(order, role, request) : null;

  if (request) return <RequestCard order={order} role={role} request={request} />;
  if (!mode) return null;
  return (
    <>
      <Button
        title={mode === 'immediate' ? 'Huỷ đơn' : 'Yêu cầu huỷ'}
        variant="secondary"
        onPress={() => setOpen(true)}
      />
      {open ? <CancelSheet order={order} role={role} mode={mode} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function RequestCard({ order, role, request }: { order: OrderDto; role: OrderRole; request: CancellationDto }) {
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
        {request.status === 'PENDING' ? <Badge label="Chờ phản hồi" tone="warning" /> : null}
      </View>
      <Line label="Người gửi" value={SIDE_LABEL[request.requestedByRole]} />
      <Line label="Lý do" value={reasonLabel(request.reasonCode)} />
      {request.note ? <Text style={styles.text}>{request.note}</Text> : null}
      <Line label="Thời gian" value={formatDateTime(request.createdAt)} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {canRespond(request, role) ? (
        <View style={styles.actions}>
          <Button
            title="Từ chối huỷ đơn"
            variant="secondary"
            style={styles.flex}
            loading={respond.isPending && answer === false}
            disabled={respond.isPending}
            onPress={() => send(false)}
          />
          <Button
            title="Đồng ý huỷ đơn"
            variant="danger"
            style={styles.flex}
            loading={respond.isPending && answer === true}
            disabled={respond.isPending}
            onPress={() => send(true)}
          />
        </View>
      ) : request.status === 'PENDING' ? (
        <Text style={styles.muted}>Đang chờ bên còn lại phản hồi.</Text>
      ) : null}
    </Card>
  );
}

function CancelSheet({ order, role, mode, onClose }: { order: OrderDto; role: OrderRole; mode: CancelMode; onClose: () => void }) {
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
        .catch((err) => setError(cancellationErrorMessage(err)))
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{mode === 'immediate' ? 'Huỷ đơn hàng' : 'Yêu cầu huỷ đơn hàng'}</Text>
          <Text style={styles.muted}>
            {mode === 'immediate'
              ? 'Đơn chưa thanh toán nên sẽ được huỷ ngay.'
              : 'Đơn đã thanh toán nên bên còn lại cần đồng ý thì đơn mới được huỷ. Mỗi đơn chỉ gửi được một yêu cầu.'}
          </Text>
          <Text style={styles.label}>Lý do</Text>
          {CANCEL_REASONS[role].map((r) => (
            <OptionRow
              key={r.code}
              kind="radio"
              label={r.label}
              selected={reasonCode === r.code}
              onPress={() => setReasonCode(r.code)}
            />
          ))}
          <TextField
            label={required ? 'Ghi chú (bắt buộc)' : 'Ghi chú (không bắt buộc)'}
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX}
            multiline
            error={note.length > 0 ? (invalidNote ?? undefined) : undefined}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title={mode === 'immediate' ? 'Xác nhận huỷ đơn' : 'Gửi yêu cầu huỷ'}
            variant="danger"
            loading={cancel.isPending}
            disabled={!reasonCode || invalidNote !== null}
            onPress={submit}
          />
          <Button title="Đóng" variant="secondary" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text, flexShrink: 1 },
  text: { fontSize: font.body, color: colors.text, flexShrink: 1 },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
  error: { fontSize: font.body, color: colors.danger },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { flexGrow: 0, maxHeight: '90%', backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  sheetBody: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
});
