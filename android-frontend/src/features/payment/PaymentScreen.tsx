import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { errorMessage, paymentErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { PaymentDto } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatDateTime, formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Button, Card, colors, ErrorState, font, Screen, SkeletonList, spacing } from '@/ui';

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

const money = (v: unknown) => formatVnd(Number(v ?? 0));

// /payment/[orderId]?option=<id>&start=1
// Checkout lands here with start=1 so the chosen gateway opens right away;
// the order screen links here without it so the user picks first.
export function PaymentScreen() {
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
          <Text style={[styles.title, { color: colors.success }]}>Thanh toán thành công</Text>
          <Text style={styles.text}>
            Đã thanh toán {money(current.amount ?? o.totalAmount)}. Tiền được giữ an toàn trong ký quỹ cho tới khi bạn nghiệm thu.
          </Text>
        </Card>
        <Button title="Xem đơn hàng" onPress={goToOrder} />
      </Screen>
    );
  }

  if (o.orderStatus !== 'PENDING_PAYMENT') {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Text style={styles.text}>Đơn này không còn ở trạng thái chờ thanh toán.</Text>
        </Card>
        <Button title="Xem đơn hàng" onPress={goToOrder} />
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
        <Line label="Mã đơn" value={o.orderNumber ?? o.orderId} />
        <Text style={styles.text}>{o.title}</Text>
        <View style={styles.row}>
          <Text style={styles.muted}>Số tiền thanh toán</Text>
          <Text testID="payment-amount" style={styles.amount}>
            {amount}
          </Text>
        </View>
        {deadline ? <Text style={styles.muted}>Hạn thanh toán: {formatDateTime(deadline.toISOString())}. Đơn sẽ tự hủy nếu chưa thanh toán trước thời điểm này.</Text> : null}
      </Card>

      {waitingPayment?.gateway === 'MOCK' ? (
        <Card>
          <Text style={styles.section}>Cổng thanh toán thử nghiệm</Text>
          <Text style={styles.muted}>Chọn kết quả để giả lập phản hồi từ cổng thanh toán. Không có tiền thật bị trừ.</Text>
          <Button title="Giả lập thành công" loading={simulate.isPending} onPress={() => void once(() => simulate.mutateAsync(true).catch(() => undefined))} />
          <Button title="Giả lập thất bại" variant="danger" disabled={simulate.isPending} onPress={() => void once(() => simulate.mutateAsync(false).catch(() => undefined))} />
        </Card>
      ) : null}

      {waitingPayment && waitingPayment.gateway !== 'MOCK' ? (
        <Card>
          <Text style={styles.section}>Đang chờ xác nhận thanh toán…</Text>
          <Text style={styles.muted}>
            {pollsExhausted
              ? 'Cổng thanh toán chưa xác nhận sau một lúc. Hãy kiểm tra lại sau trong mục Đơn hàng.'
              : 'Hệ thống đang chờ cổng thanh toán xác nhận. Màn hình sẽ tự cập nhật.'}
          </Text>
          {waitingPayment.paymentUrl ? (
            <Button title="Mở lại trang thanh toán" onPress={() => void once(() => openGateway(waitingPayment))} />
          ) : null}
          <Button title="Kiểm tra lại" variant="secondary" loading={payment.isRefetching} onPress={() => void payment.refetch()} />
        </Card>
      ) : null}

      {waiting ? <Button title="Đổi cách thanh toán" variant="secondary" onPress={() => setChoosing(true)} /> : null}

      {failedPayment ? (
        <Card>
          <Text style={[styles.section, { color: colors.danger }]}>Thanh toán không thành công</Text>
          <Text style={styles.muted}>
            {failedPayment.status === 'FAILED'
              ? (failedPayment.failureMessage ?? 'Giao dịch không thành công. Bạn có thể thử lại hoặc chọn cổng khác.')
              : 'Giao dịch đã hết hạn hoặc bị hủy.'}
          </Text>
        </Card>
      ) : null}

      {!waiting ? (
        <>
          <Text style={styles.section}>Phương thức thanh toán</Text>
          <PaymentOptionPicker value={optionId} onChange={setOptionId} />
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!waiting ? (
        <Button title={failed ? 'Thử thanh toán lại' : `Thanh toán ${amount}`} loading={pay.isPending} onPress={startPay} />
      ) : null}
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.text} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text, flexShrink: 1 },
  amount: { fontSize: font.title, fontWeight: '700', color: colors.primaryDark },
  muted: { fontSize: font.small + 1, color: colors.muted, flexShrink: 1 },
  error: { fontSize: font.body, color: colors.danger },
});
