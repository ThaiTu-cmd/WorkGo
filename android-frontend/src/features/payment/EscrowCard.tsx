import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { OrderRole } from '@/api/types';
import { formatVnd } from '@/lib/format';
import { Badge, Card, font, makeStyles, spacing, type Tone } from '@/ui';

import { ESCROW_STATUS_LABEL } from './payment';
import { useT } from '@/i18n';

const money = (v: unknown) => formatVnd(Number(v ?? 0));

const TONE: Record<string, Tone> = {
  HOLDING: 'info',
  RELEASED: 'success',
  REFUNDED: 'neutral',
  PARTIALLY_REFUNDED: 'warning',
  FROZEN: 'danger',
};

// Where the order's money is. Hidden until payment-service has an escrow
// for the order (3101 before payment) or when it cannot be loaded.
export function EscrowCard({ orderId, role }: { orderId: string; role: OrderRole }) {
  const t = useT();
  const styles = useStyles();
  const escrow = useQuery({
    queryKey: qk.escrow(orderId),
    queryFn: async () => (await paymentApi.getEscrow(orderId)).result,
    // No escrow yet (e.g. an order cancelled before payment) is a final answer.
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
  const e = escrow.data;
  if (!e) return null;

  const note =
    e.status === 'HOLDING'
      ? role === 'PROVIDER'
        ? t('escrowCard.ban_nhan_sau_khi_khach', { p0: money(e.providerNetAmount) })
        : t('escrowCard.tien_duoc_giu_an_toan')
      : e.status === 'FROZEN'
        ? t('escrowCard.tien_dang_tam_khoa_trong')
        : null;

  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.section}>{t('escrowCard.ky_quy_escrow')}</Text>
        <Badge label={ESCROW_STATUS_LABEL[e.status] ?? e.status} tone={TONE[e.status] ?? 'neutral'} />
      </View>
      <Line label={t('escrowCard.tong_tien_ky_quy')} value={money(e.heldAmount)} />
      {Number(e.releasedAmount ?? 0) > 0 ? <Line label={t('escrowCard.da_chuyen_cho_chuyen_gia')} value={money(e.releasedAmount)} /> : null}
      {Number(e.refundedAmount ?? 0) > 0 ? <Line label={t('escrowCard.da_hoan_tien')} value={money(e.refundedAmount)} /> : null}
      {note ? <Text style={styles.muted}>{note}</Text> : null}
    </Card>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
}));
