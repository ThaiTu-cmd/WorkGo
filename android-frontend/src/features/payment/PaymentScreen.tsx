import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Text, View } from 'react-native';

import { errorMessage, paymentErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { PaymentDto } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatDateTime, formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Button, Card, ErrorState, font, makeStyles, Screen, SkeletonList, spacing, useColors } from '@/ui';

import {
  findPaymentOption,
  isPaymentWaiting,
  MOCK_PAYMENT_ENABLED,
  paymentDeadline,
  pickResumablePayment,
  pollInterval,
  POLL_LIMIT,
  newIdempotencyKey,
} from './payment';
import { PaymentOptionPicker } from './PaymentOptionPicker';
import { useT } from '@/i18n';

const money = (v: unknown) => formatVnd(Number(v ?? 0));

// /payment/[orderId]?option=<id>&start=1
// Checkout lands here with start=1 so the chosen gateway opens right away;
// the order screen links here without it so the user picks first.
export function PaymentScreen() {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const signedIn = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const once = useSingleFlight();
  const params = useLocalSearchParams<{ orderId: string; option?: string; start?: string }>();
  const orderId = params.orderId;

  const [optionId, setOptionId] = React.useState(() => findPaymentOption(params.option, MOCK_PAYMENT_ENABLED).id);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  // "Đổi cách thanh toán": stop showing the waiting payment and let the user pick again.
  const [choosing, setChoosing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const order = useQuery({
    queryKey: qk.order(orderId),
    enabled: signedIn,
    queryFn: async () => (await orderApi.getOrder(orderId)).result.order,
  });
  const payments = useQuery({
    queryKey: qk.payments(orderId),
    enabled: signedIn,
    queryFn: async () => (await paymentApi.getPaymentsOfOrder(orderId)).result ?? [],
  });

  const paymentId = activeId ?? pickResumablePayment(payments.data)?.paymentId ?? null;
  const payment = useQuery({
    queryKey: qk.payment(paymentId ?? ''),
    enabled: signedIn && !!paymentId,
    queryFn: async () => (await paymentApi.getPayment(paymentId as string)).result,
    refetchInterval: (q) => pollInterval(q.state.data, q.state.dataUpdateCount),
  });
  const current = choosing ? null : (payment.data ?? null);

  const remember = (p: PaymentDto) => {
    queryClient.setQueryData(qk.payment(p.paymentId), p);
    setActiveId(p.paymentId);
    setChoosing(false);
  };

  const pay = useMutation({
    mutationFn: async () => {
      const option = findPaymentOption(optionId, MOCK_PAYMENT_ENABLED);
      const res = await paymentApi.createPayment(
        { orderId, gateway: option.gateway, paymentMethod: option.paymentMethod },
        newIdempotencyKey()
      );
      return res.result;
    },
    onSuccess: async (p) => {
      remember(p);
      if (p.gateway !== 'MOCK' && p.paymentUrl) await openGateway(p);
    },
    onError: (err) => setError(paymentErrorMessage(err)),
  });

  // Resolves when the user closes the browser; the IPN may already have
  // settled the payment by then, so check right away (polling continues).
  const openGateway = async (p: PaymentDto) => {
    if (!p.paymentUrl) return;
    await WebBrowser.openBrowserAsync(p.paymentUrl);
    await queryClient.refetchQueries({ queryKey: qk.payment(p.paymentId) });
  };

  const simulate = useMutation({
    mutationFn: async (success: boolean) => (await paymentApi.simulateMock((current as PaymentDto).paymentCode, success)).result,
    onSuccess: remember,
    onError: (err) => setError(paymentErrorMessage(err)),
  });

  // onError above shows the message; the guard only needs the promise to settle.
  const runPay = () => void once(() => pay.mutateAsync().catch(() => undefined));
  const startPay = () => {
    setError(null);
    runPay();
  };

  // start=1: begin once, when nothing is already waiting for this order.
  const autoStarted = React.useRef(false);
  const order_ = order.data;
  React.useEffect(() => {
    if (params.start !== '1' || autoStarted.current) return;
    if (!order_ || order_.orderStatus !== 'PENDING_PAYMENT' || !payments.isSuccess) return;
    autoStarted.current = true;
    if (!pickResumablePayment(payments.data)) runPay();
    // runPay only reads state captured at this render; running it once is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.start, order_, payments.isSuccess, payments.data]);

  const succeeded = current?.status === 'SUCCEEDED';
  React.useEffect(() => {
    if (!succeeded) return;
    void queryClient.invalidateQueries({ queryKey: qk.order(orderId) });
    void queryClient.invalidateQueries({ queryKey: qk.orderHistory(orderId) });
    void queryClient.invalidateQueries({ queryKey: qk.orders('CLIENT') });
    void queryClient.invalidateQueries({ queryKey: qk.escrow(orderId) });
  }, [succeeded, orderId, queryClient]);

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (order.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={2} height={100} />
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
  const goToOrder = () => router.replace({ pathname: '/orders/[id]', params: { id: orderId, role: 'CLIENT' } });

  if (succeeded) {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Text style={[styles.title, { color: colors.success }]}>{t('paymentScreen.thanh_toan_thanh_cong')}</Text>
          <Text style={styles.text}>{t('paymentScreen.da_thanh_toan_tien_duoc', { p0: money(current.amount ?? o.totalAmount) })}</Text>
        </Card>
        <Button title={t('paymentScreen.xem_don_hang')} onPress={goToOrder} />
      </Screen>
    );
  }

  if (o.orderStatus !== 'PENDING_PAYMENT') {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Text style={styles.text}>{t('paymentScreen.don_nay_khong_con_o')}</Text>
        </Card>
        <Button title={t('paymentScreen.xem_don_hang')} onPress={goToOrder} />
      </Screen>
    );
  }

  const deadline = paymentDeadline(o);
  const waitingPayment = current && isPaymentWaiting(current) ? current : null;
  const failedPayment = current && !waitingPayment ? current : null;
  const waiting = !!waitingPayment;
  const failed = !!failedPayment;
  const polls = paymentId ? (queryClient.getQueryState(qk.payment(paymentId))?.dataUpdateCount ?? 0) : 0;
  const pollsExhausted = !!waitingPayment && waitingPayment.gateway !== 'MOCK' && polls >= POLL_LIMIT;
  const amount = money(o.totalAmount);

  return (
    <Screen edges={['bottom']} onRefresh={() => void payment.refetch()} refreshing={payment.isRefetching}>
      <Card>
        <Line label={t('paymentScreen.ma_don')} value={o.orderNumber ?? o.orderId} />
        <Text style={styles.text}>{o.title}</Text>
        <View style={styles.row}>
          <Text style={styles.muted}>{t('paymentScreen.so_tien_thanh_toan')}</Text>
          <Text testID="payment-amount" style={styles.amount}>
            {amount}
          </Text>
        </View>
        {deadline ? <Text style={styles.muted}>{t('paymentScreen.han_thanh_toan_don_se', { p0: formatDateTime(deadline.toISOString()) })}</Text> : null}
      </Card>

      {waitingPayment?.gateway === 'MOCK' ? (
        <Card>
          <Text style={styles.section}>{t('paymentScreen.cong_thanh_toan_thu_nghiem')}</Text>
          <Text style={styles.muted}>{t('paymentScreen.chon_ket_qua_de_gia')}</Text>
          <Button title={t('paymentScreen.gia_lap_thanh_cong')} loading={simulate.isPending} onPress={() => void once(() => simulate.mutateAsync(true).catch(() => undefined))} />
          <Button title={t('paymentScreen.gia_lap_that_bai')} variant="danger" disabled={simulate.isPending} onPress={() => void once(() => simulate.mutateAsync(false).catch(() => undefined))} />
        </Card>
      ) : null}

      {waitingPayment && waitingPayment.gateway !== 'MOCK' ? (
        <Card>
          <Text style={styles.section}>{t('paymentScreen.dang_cho_xac_nhan_thanh')}</Text>
          <Text style={styles.muted}>
            {pollsExhausted
              ? t('paymentScreen.cong_thanh_toan_chua_xac')
              : t('paymentScreen.he_thong_dang_cho_cong')}
          </Text>
          {waitingPayment.paymentUrl ? (
            <Button title={t('paymentScreen.mo_lai_trang_thanh_toan')} onPress={() => void once(() => openGateway(waitingPayment))} />
          ) : null}
          <Button title={t('paymentScreen.kiem_tra_lai')} variant="secondary" loading={payment.isRefetching} onPress={() => void payment.refetch()} />
        </Card>
      ) : null}

      {waiting ? <Button title={t('paymentScreen.doi_cach_thanh_toan')} variant="secondary" onPress={() => setChoosing(true)} /> : null}

      {failedPayment ? (
        <Card>
          <Text style={[styles.section, { color: colors.danger }]}>{t('paymentScreen.thanh_toan_khong_thanh_cong')}</Text>
          <Text style={styles.muted}>
            {failedPayment.status === 'FAILED'
              ? (failedPayment.failureMessage ?? t('paymentScreen.giao_dich_khong_thanh_cong'))
              : t('paymentScreen.giao_dich_da_het_han')}
          </Text>
        </Card>
      ) : null}

      {!waiting ? (
        <>
          <Text style={styles.section}>{t('paymentScreen.phuong_thuc_thanh_toan')}</Text>
          <PaymentOptionPicker value={optionId} onChange={setOptionId} />
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!waiting ? (
        <Button title={failed ? t('paymentScreen.thu_thanh_toan_lai') : t('paymentScreen.thanh_toan', { p0: amount })} loading={pay.isPending} onPress={startPay} />
      ) : null}
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.text} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text, flexShrink: 1 },
  amount: { fontSize: font.title, fontWeight: '700', color: colors.primaryDark },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
  error: { fontSize: font.body, color: colors.danger },
}));
