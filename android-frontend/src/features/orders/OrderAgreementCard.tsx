import {RewardQuoteCard} from './RewardQuoteCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { ApiError, orderErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { OrderAmendment, OrderDto, OrderRole } from '@/api/types';
import { useT } from '@/i18n';
import { formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Button, Card, makeStyles, TextField, font } from '@/ui';

const statuses = {
  PENDING: 'agreement.pending',
  AWAITING_PAYMENT: 'agreement.awaiting_payment',
  APPLIED: 'agreement.applied',
  REJECTED: 'agreement.rejected',
} as const;
const positiveInteger = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

export function OrderAgreementCard({ order, role }: { order: OrderDto; role: OrderRole }) {
  const t = useT();
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const once = useSingleFlight();
  const { orderId } = order;
  const versionsKey = [...qk.order(orderId), 'agreement'];
  const amendmentsKey = [...qk.order(orderId), 'amendments'];
  const agreement = useQuery({ queryKey: versionsKey, queryFn: async () => (await orderApi.getAgreement(orderId)).result });
  const amendments = useQuery({ queryKey: amendmentsKey, queryFn: async () => (await orderApi.getAmendments(orderId)).result });
  const current = agreement.data?.at(-1);
  const rows = amendments.data ?? [];
  const closed = order.orderStatus === 'CANCELLED' || order.orderStatus === 'COMPLETED';
  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [insufficientAmendment, setInsufficientAmendment] = useState<OrderAmendment | null>(null);
  const wallet = useQuery({
    queryKey: qk.wallet(),
    enabled: !!insufficientAmendment,
    queryFn: async () => (await paymentApi.getWallet()).result,
  });

  const refresh = () => Promise.all(
    [qk.order(orderId), qk.orderExecution(orderId), qk.orderHistory(orderId), qk.escrow(orderId), qk.wallet()].map(
      (queryKey) => queryClient.invalidateQueries({ queryKey })
    )
  );
  const change = useMutation({
    networkMode: 'always',
    mutationFn: async (send: () => ReturnType<typeof orderApi.proposeAmendment>) => (await send()).result,
    onSuccess: async (result) => {
      queryClient.setQueryData<OrderAmendment[]>(amendmentsKey, (previous = []) => [
        result, ...previous.filter((item) => item.amendmentId !== result.amendmentId),
      ]);
      setEditing(false);
      setScope('');
      setPrice('');
      setDays('');
      setReason('');
      await refresh();
    },
    onError: () => { void refresh(); },
  });
  const run = (send: () => ReturnType<typeof orderApi.proposeAmendment>, amendment?: OrderAmendment) => {
    void once(async () => {
      setInsufficientAmendment(null);
      try {
        await change.mutateAsync(send);
      } catch (err) {
        if (amendment && err instanceof ApiError && err.code === 3041) setInsufficientAmendment(amendment);
      }
    });
  };

  const newScope = scope.trim();
  const canSetPrice = order.orderStatus !== 'PENDING_PAYMENT';
  const digital = order.executionType === 'DIGITAL';
  const validDraft = !!reason.trim() &&
    (!price || positiveInteger(price)) && (!days || (positiveInteger(days) && Number(days) <= 2147483647)) &&
    ((!!newScope && newScope !== current?.scope) ||
      (!!price && Number(price) !== Number(current?.price)) ||
      (!!days && Number(days) !== current?.durationDays));
  const shortage = insufficientAmendment && wallet.data && current
    ? Math.max(0, Number(insufficientAmendment.newPrice) - Number(current.price) - wallet.data.balance) : 0;

  return (
    <Card>
      <RewardQuoteCard orderId={orderId} revision={current?.rewardQuoteRef}/>
      <Text style={styles.title}>{t('agreement.title')}</Text>
      {agreement.isPending || amendments.isPending ? <Text>{t('agreement.loading')}</Text> : null}
      {(agreement.error || amendments.error) ? (
        <>
          <Text style={styles.error}>{orderErrorMessage(agreement.error ?? amendments.error)}</Text>
          <Button title={t('paymentScreen.kiem_tra_lai')} variant="secondary"
            onPress={() => { void agreement.refetch(); void amendments.refetch(); }} />
        </>
      ) : null}
      {(agreement.data ?? []).map((version) => (
        <Card key={version.agreementVersionId}>
          <Text style={styles.title}>{t('agreement.version', { p0: version.versionNo })} · {formatVnd(Number(version.price))}</Text>
          {version.scope ? <Text style={styles.text}>{version.scope}</Text> : null}
          {version.acceptanceCriteria ? <Text style={styles.text}>{version.acceptanceCriteria}</Text> : null}
          {version.inputRequirements != null ? <Text selectable>{version.inputRequirements}</Text> : null}
          {version.address ? <Text>{version.address}</Text> : null}
          {version.scheduleStart ? <Text>{new Date(version.scheduleStart).toLocaleString()} — {version.scheduleEnd ? new Date(version.scheduleEnd).toLocaleString() : ''}</Text> : null}
          {version.paymentMethod ? <Text>{version.paymentMethod} · {version.policyVersion}</Text> : null}
          {version.durationDays ? <Text style={styles.text}>{t('agreement.days', { p0: version.durationDays })}</Text> : null}
        </Card>
      ))}
      {rows.map((item) => {
        const canRespond = item.status === 'PENDING' && !closed && item.proposedByRole !== role;
        const canSettle = item.status === 'AWAITING_PAYMENT' && !closed && !!current &&
          (role === 'CLIENT' || Number(item.newPrice) <= Number(current.price));
        return (
          <Card key={item.amendmentId}>
            <RewardQuoteCard orderId={orderId} amendmentId={item.amendmentId}/>
            <Text style={styles.title}>{t(statuses[item.status])}</Text>
            {item.reason ? <Text style={styles.text}>{item.reason}</Text> : null}
            {item.oldScope && item.newScope ? <Text selectable>{item.oldScope} → {item.newScope}</Text> : null}
            {item.oldPrice != null && item.newPrice != null ? <Text>{formatVnd(Number(item.oldPrice))} → {formatVnd(Number(item.newPrice))}</Text> : null}
            {item.oldDurationDays != null && item.newDurationDays != null ? <Text>{t('agreement.days', { p0: item.oldDurationDays })} → {t('agreement.days', { p0: item.newDurationDays })}</Text> : null}
            {item.newScope ? <Text style={styles.text}>{item.newScope}</Text> : null}
            {item.newPrice != null ? <Text style={styles.text}>{t('agreement.new_price', { p0: formatVnd(Number(item.newPrice)) })}</Text> : null}
            {item.newDurationDays ? <Text style={styles.text}>{t('agreement.days', { p0: item.newDurationDays })}</Text> : null}
            {canRespond ? (
              <>
                <Button title={t('agreement.accept')} loading={change.isPending}
                  onPress={() => run(() => orderApi.respondAmendment(orderId, item.amendmentId, 'accept'))} />
                <Button title={t('agreement.reject')} variant="secondary" disabled={change.isPending}
                  onPress={() => run(() => orderApi.respondAmendment(orderId, item.amendmentId, 'reject'))} />
              </>
            ) : null}
            {canSettle ? (
              <Button title={t('agreement.settle')} loading={change.isPending}
                onPress={() => run(() => orderApi.settleAmendment(orderId, item.amendmentId), item)} />
            ) : null}
          </Card>
        );
      })}
      {!closed && current?.inputRequirements != null && ['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'].includes(order.orderStatus) && amendments.isSuccess && !rows.some((item) => item.status === 'PENDING' || item.status === 'AWAITING_PAYMENT') && (
        editing ? (
          <>
            <TextField label={t('agreement.scope_label')} value={scope} onChangeText={setScope} />
            {canSetPrice && <TextField label={t('agreement.price_label')} keyboardType="number-pad" value={price} onChangeText={setPrice} />}
            {digital && <TextField label={t('agreement.days_label')} keyboardType="number-pad" value={days} onChangeText={setDays} />}
            <TextField label={t('agreement.reason')} value={reason} onChangeText={setReason} />
            <Button title={t('agreement.send')} disabled={!validDraft} loading={change.isPending}
              onPress={() => run(() => orderApi.proposeAmendment(orderId, {
                baseVersionNo: current.versionNo,
                reason: reason.trim(),
                ...(newScope && { newScope }),
                ...(canSetPrice && price && { newPrice: Number(price) }),
                ...(digital && days && { newDurationDays: Number(days) }),
              }))} />
          </>
        ) : <Button title={t('agreement.propose')} variant="secondary" onPress={() => setEditing(true)} />
      )}
      {change.error && <Text style={styles.error} accessibilityLiveRegion="polite">{orderErrorMessage(change.error)}</Text>}
      {shortage > 0 && (
        <Button title={t('paymentScreen.top_up_shortage', { p0: formatVnd(shortage) })}
          onPress={() => router.push({ pathname: '/payment/topup', params: { amount: String(shortage), orderId, fromAmendment: '1' } })} />
      )}
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { color: colors.text, fontWeight: '700', fontSize: font.body },
  text: { color: colors.text, fontSize: font.body },
  error: { color: colors.danger, fontSize: font.body },
}));
