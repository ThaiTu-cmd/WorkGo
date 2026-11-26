import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { errorMessage, orderErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { ExecutionDto, OrderRole } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { EscrowCard } from '@/features/payment/EscrowCard';
import { formatDateTime, formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Badge, Button, Card, ErrorState, font, makeStyles, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { CancellationCard } from './CancellationCard';
import { DigitalDeliveryCard } from './DigitalDeliveryCard';
import { EvidenceGrid } from './EvidenceGrid';
import { OrderAgreementCard } from './OrderAgreementCard';
import { OrderInputCard } from './OrderInputCard';
import { useOrderDetail } from './hooks';
import { ONSITE_STATUS_LABEL, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from './orderStatus';
import { OrderReviewCard } from '@/features/reviews/OrderReviewCard';
import { useT } from '@/i18n';

const money = (v: unknown) => formatVnd(Number(v ?? 0));

// `evidenceFooter` lets the provider task add its upload button without
// this screen knowing about uploads.
export function OrderDetailScreen({
  evidenceFooter,
}: {
  evidenceFooter?: (ctx: { orderId: string; role: OrderRole; detail: ReturnType<typeof useOrderDetail> }) => React.ReactNode;
}) {
  const t = useT();
  const styles = useStyles();
  const signedIn = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const once = useSingleFlight();
  const { id, role: roleParam } = useLocalSearchParams<{ id: string; role?: string }>();
  const role: OrderRole = roleParam === 'PROVIDER' ? 'PROVIDER' : 'CLIENT';
  const detail = useOrderDetail(id, signedIn);
  const { order, history, execution, cancellation } = detail;
  const onsite = execution.data?.onsite;
  const scheduled = order.data?.orderStatus === 'CONFIRMED' && onsite?.status === 'SCHEDULED';
  const [code, setCode] = useState('');
  const [cashAmount,setCashAmount]=useState('');
  const cashReturn=useQuery({queryKey:['cashReturn',id],enabled:signedIn&&order.data?.paymentMethod==='CASH',retry:false,queryFn:()=>paymentApi.getCashReturn(id)});
  const returnMutation=useMutation({mutationFn:async()=>{const receipt=cashReturn.data;if(!receipt)throw new Error('Missing cash return receipt');const ack=await paymentApi.confirmCashReturn(receipt.decisionId,receipt.cashReturnDue);if(ack.decisionId!==receipt.decisionId||ack.orderId!==receipt.orderId||ack.cashReturnDue!==receipt.cashReturnDue||ack.status!=='COMPLETED')throw new Error('Missing cash return acknowledgement');return ack;},onSuccess:ack=>{queryClient.setQueryData(['cashReturn',id],ack);void order.refetch();}});
  const checkin = useQuery({
    queryKey: [...qk.order(id), 'checkin-code'],
    enabled: signedIn && role === 'CLIENT' && scheduled,
    gcTime: 0,
    queryFn: async () => (await orderApi.getCheckinCode(id)).result.checkinCode,
  });
  const onsiteAction = useMutation({
    networkMode: 'always',
    mutationFn: async (action: () => ReturnType<typeof orderApi.confirmCashReceived>) => (await action()).result,
    onSuccess: (onsite) => {
      queryClient.setQueryData<ExecutionDto>(qk.orderExecution(id), (previous) => previous && { ...previous, onsite });
      for (const queryKey of [qk.order(id), qk.orderExecution(id), qk.orderHistory(id), qk.orders(role), qk.wallet()]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: () => { void execution.refetch(); void order.refetch(); },
  });
  const runAction = (action: () => ReturnType<typeof orderApi.confirmCashReceived>) =>
    void once(() => onsiteAction.mutateAsync(action).catch(() => undefined));

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (order.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={3} height={100} />
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState message={errorMessage(order.error)} onRetry={() => void order.refetch()} />
      </Screen>
    );
  }

  const o = order.data;
  const cash = o.paymentMethod === 'CASH';
  const awaitingPayment = !cash && o.orderStatus === 'PENDING_PAYMENT';
  const canConfirmCash = cash && role === 'PROVIDER' && !onsite?.cashReceivedAt &&
    (o.orderStatus === 'IN_PROGRESS' || o.orderStatus === 'DELIVERED'||o.orderStatus==='COMPLETED'&&o.paymentStatus==='CASH_ON_SITE');
  const canClaimCash=cash&&role==='CLIENT'&&!onsite?.clientCashPaidAt&&['IN_PROGRESS','DELIVERED','COMPLETED'].includes(o.orderStatus);
  const cashAmountValid=/^\d+$/.test(cashAmount.trim())&&Number.isSafeInteger(Number(cashAmount))&&Number(cashAmount)>=0&&Number(cashAmount)<=Number(o.totalAmount);
  const refresh = () => {
    void order.refetch();
    void history.refetch();
    void execution.refetch();
    void cancellation.refetch();
  };

  return (
    <Screen edges={['bottom']} onRefresh={refresh} refreshing={order.isRefetching}>
      <Card>
        <View style={styles.row}>
          <Text style={styles.muted} numberOfLines={1} ellipsizeMode="middle">
            {o.orderNumber ?? o.orderId}
          </Text>
          <Badge label={ORDER_STATUS_LABEL[o.orderStatus]} tone={ORDER_STATUS_TONE[o.orderStatus]} />
        </View>
        <Text style={styles.title}>{o.title}</Text>
        {awaitingPayment ? <Text style={styles.muted}>{t('orderDetailScreen.don_dang_cho_thanh_toan')}</Text> : null}
        <View style={styles.actionRow}>
          {awaitingPayment && role === 'CLIENT' ? (
            <Button
              title={t('orderDetailScreen.thanh_toan')}
              style={styles.flexBtn}
              onPress={() => router.push({ pathname: '/payment/[orderId]', params: { orderId: o.orderId } })}
            />
          ) : null}
          <Button
            title={t('chat.nhan_tin')}
            variant={awaitingPayment && role === 'CLIENT' ? 'secondary' : 'primary'}
            style={awaitingPayment && role === 'CLIENT' ? styles.flexBtn : undefined}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: {
                  contextType: 'ORDER',
                  contextId: o.orderId,
                  participantId: (role === 'CLIENT' ? o.providerId : o.clientId) ?? undefined,
                  participantName: o.title,
                },
              })
            }
          />
        </View>
      </Card>

      {o.orderStatus === 'COMPLETED' ? (
        <OrderReviewCard orderId={o.orderId} serviceId={o.serviceId} />
      ) : null}

      <CancellationCard order={o} role={role} cancellation={cancellation} />

      {!awaitingPayment && !cash ? <EscrowCard orderId={o.orderId} role={role} /> : null}

      <Card>
        <Line label={t('orderDetailScreen.tam_tinh')} value={money(o.subtotal)} />
        <Line label={t('orderDetailScreen.phi_nen_tang')} value={money(o.platformFee)} />
        <Line label={t('orderDetailScreen.tong_cong')} value={money(o.totalAmount)} strong />
      </Card>

      <OrderAgreementCard order={o} role={role} />
      <OrderInputCard order={o} role={role} />

      {o.executionType === 'DIGITAL' ? <DigitalDeliveryCard key={o.orderId} order={o} role={role} execution={execution.data?.digital} /> : null}

      {onsite ? (
        <Card>
          <Text style={styles.section}>{t('orderDetailScreen.thuc_hien_tai_nha')}</Text>
          <Line label={t('orderDetailScreen.trang_thai')} value={ONSITE_STATUS_LABEL[onsite.status]} />
          {onsite.scheduledStart ? <Line label={t('orderDetailScreen.lich_hen')} value={formatDateTime(onsite.scheduledStart)} /> : null}
          {onsite.addressSnapshot ? <Text style={styles.text}>{onsite.addressSnapshot}</Text> : null}
          {scheduled && role === 'CLIENT' && checkin.data && (
            <Line label={t('orderDetailScreen.checkin_code')} value={checkin.data} strong />
          )}
          {scheduled && role === 'CLIENT' && checkin.isError && (
            <ErrorState message={orderErrorMessage(checkin.error)} onRetry={() => void checkin.refetch()} />
          )}
          {scheduled && role === 'PROVIDER' && (
            <>
              <TextField label={t('orderDetailScreen.checkin_code')} keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
              <Button title={t('orderDetailScreen.check_in')} disabled={!/^\d{6}$/.test(code)} loading={onsiteAction.isPending}
                onPress={() => runAction(() => orderApi.checkInOnsite(id, code))} />
            </>
          )}
          {role === 'PROVIDER' && o.orderStatus === 'IN_PROGRESS' && onsite.status === 'IN_SERVICE' && (
            <Button title={t('orderDetailScreen.complete_onsite')} loading={onsiteAction.isPending}
              onPress={() => runAction(() => orderApi.completeOnsite(id))} />
          )}
          {role === 'CLIENT' && o.orderStatus === 'DELIVERED' && onsite.status === 'SERVICE_DONE' && (
            <Button title={t('orderDetailScreen.accept_onsite')} loading={onsiteAction.isPending}
              onPress={() => runAction(() => orderApi.acceptOnsite(id))} />
          )}
          {cash && (
            <Text style={styles.text}>{onsite.cashReceivedAt
              ? t('orderDetailScreen.cash_received_at', { p0: formatDateTime(onsite.cashReceivedAt) })
              : t('orderDetailScreen.cash_not_confirmed')}</Text>
          )}
          {cash&&<><Text>Nghiệm thu: {onsite.clientAcceptedAt?'Đã nghiệm thu':'Đang chờ'} · Phí: {o.paymentStatus==='CASH_SETTLED'?'Đã ghi sổ':'Chờ receipt'}</Text><Text>Khách khai đã trả: {onsite.clientCashPaidAmount!=null?money(onsite.clientCashPaidAmount):'Chưa ghi nhận'} · Provider thực nhận: {onsite.actualReceivedAmount!=null?money(onsite.actualReceivedAmount):'Chưa ghi nhận'}</Text></>}
          {(canConfirmCash||canClaimCash)&&<TextField label={role==='PROVIDER'?'Số tiền thực nhận (VND)':'Số tiền khách khai đã trả (VND)'} keyboardType="number-pad" value={cashAmount} onChangeText={setCashAmount}/>}
          {canClaimCash&&<Button title="Ghi nhận số tiền tôi đã trả" disabled={!cashAmountValid} loading={onsiteAction.isPending} onPress={()=>runAction(()=>orderApi.recordCashPaid(id,Number(cashAmount)))}/>}
          {canConfirmCash && (
            <Button
              title={t('orderDetailScreen.confirm_cash_received')}
              loading={onsiteAction.isPending}
              disabled={!cashAmountValid}
              onPress={() => runAction(() => orderApi.confirmCashReceived(id,Number(cashAmount)))}
            />
          )}
          {onsiteAction.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{orderErrorMessage(onsiteAction.error)}</Text>}
        </Card>
      ) : null}

      {cashReturn.data&&<Card><Text>Phí hủy: {money(cashReturn.data.feeAmount)} · Tiền mặt cần hoàn trực tiếp: {money(cashReturn.data.cashReturnDue)} · {cashReturn.data.status}</Text>{role==='CLIENT'&&cashReturn.data.status==='AWAITING_CASH_RETURN'&&<Button title="Tôi xác nhận đã nhận đủ tiền mặt hoàn lại" loading={returnMutation.isPending} onPress={()=>void once(()=>returnMutation.mutateAsync().catch(()=>undefined))}/>}</Card>}
      {cashReturn.error&&(cashReturn.error as {status?:number}).status!==404&&<Text style={styles.error}>{orderErrorMessage(cashReturn.error)}</Text>}
      {returnMutation.error&&<Text style={styles.error}>{orderErrorMessage(returnMutation.error)}</Text>}
      <Card>
        <Text style={styles.section}>{t('orderDetailScreen.lich_su')}</Text>
        {(history.data ?? []).length === 0 ? (
          <Text style={styles.muted}>{t('orderDetailScreen.dat_luc', { p0: formatDateTime(o.placedAt ?? o.createdAt) })}</Text>
        ) : (
          (history.data ?? []).map((h, i) => (
            <View key={h.orderStatusHistoryId ?? i} style={styles.row}>
              <Text style={styles.text}>{ORDER_STATUS_LABEL[h.toStatus] ?? h.toStatus}</Text>
              <Text style={styles.muted}>{formatDateTime(h.createdAt)}</Text>
            </View>
          ))
        )}
      </Card>

      {o.executionType === 'ONSITE' ? (
        <EvidenceGrid orderId={o.orderId} footer={evidenceFooter?.({ orderId: o.orderId, role, detail })} />
      ) : null}
    </Screen>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.text, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  section: { fontSize: font.body, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  strong: { fontWeight: '700', color: colors.primaryDark },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
  error: { fontSize: font.body, color: colors.danger },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  flexBtn: { flex: 1 },
}));
