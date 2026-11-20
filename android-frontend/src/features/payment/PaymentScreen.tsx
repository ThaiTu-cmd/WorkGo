import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ApiError, errorMessage, paymentErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { useT } from '@/i18n';
import { formatDateTime, formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Button, Card, ErrorState, font, makeStyles, Screen, SkeletonList, spacing } from '@/ui';

import { paymentDeadline } from './payment';

export function PaymentScreen() {
  const t = useT();
  const styles = useStyles();
  const signedIn = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const once = useSingleFlight();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const order = useQuery({
    queryKey: qk.order(orderId),
    enabled: signedIn,
    queryFn: async () => (await orderApi.getOrder(orderId)).result.order,
  });
  const o = order.data;
  const canPay = o?.orderStatus === 'PENDING_PAYMENT' && o.paymentMethod !== 'CASH';
  const escrow = useQuery({
    queryKey: qk.escrow(orderId),
    enabled: signedIn && !!o && o.paymentMethod !== 'CASH' && o.orderStatus !== 'CANCELLED',
    queryFn: async () => (await paymentApi.getEscrow(orderId)).result,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
  const hasEscrow = !!escrow.data;
  const wallet = useQuery({
    queryKey: qk.wallet(),
    enabled: signedIn && canPay && !hasEscrow,
    queryFn: async () => (await paymentApi.getWallet()).result,
  });
  const refresh = () => {
    void order.refetch();
    if (o?.paymentMethod !== 'CASH' && o?.orderStatus !== 'CANCELLED') void escrow.refetch();
    if (canPay && !hasEscrow) void wallet.refetch();
  };

  const pay = useMutation({
    networkMode: 'always',
    mutationFn: async () => (await paymentApi.payOrder(orderId)).result,
    onSuccess: (receipt) => {
      queryClient.setQueryData(qk.escrow(orderId), receipt);
      for (const queryKey of [qk.order(orderId), qk.orderHistory(orderId), qk.orders('CLIENT'), qk.wallet()]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: refresh,
  });

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (order.isPending) return <Screen edges={['bottom']}><SkeletonList count={2} height={100} /></Screen>;
  if (order.isError || !o) {
    return <Screen edges={['bottom']}><ErrorState message={errorMessage(order.error)} onRetry={() => void order.refetch()} /></Screen>;
  }

  const goToOrder = () => router.replace({ pathname: '/orders/[id]', params: { id: orderId, role: 'CLIENT' } });
  const receipt = escrow.data;
  if (receipt?.status === 'HOLDING') {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Text style={styles.success}>{t('paymentScreen.thanh_toan_thanh_cong')}</Text>
          <Text style={styles.text}>{t('paymentScreen.da_thanh_toan_tien_duoc', { p0: formatVnd(Number(receipt.heldAmount ?? o.totalAmount)) })}</Text>
        </Card>
        <Button title={t('paymentScreen.xem_don_hang')} onPress={goToOrder} />
      </Screen>
    );
  }

  if (!canPay || hasEscrow) {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Text style={styles.text}>{t(o.paymentMethod === 'CASH' ? 'paymentScreen.cash_order' : 'paymentScreen.don_nay_khong_con_o')}</Text>
        </Card>
        <Button title={t('paymentScreen.xem_don_hang')} onPress={goToOrder} />
      </Screen>
    );
  }

  const deadline = paymentDeadline(o);
  const total = Number(o.totalAmount ?? 0);
  const balance = wallet.data?.balance;
  const shortage = balance === undefined ? 0 : Math.max(0, total - balance);
  const escrowNotFound = escrow.error instanceof ApiError && escrow.error.status === 404;
  const readError = wallet.error ?? (escrowNotFound ? null : escrow.error);
  const ready = escrowNotFound && balance !== undefined && !wallet.isFetching && !escrow.isFetching;

  return (
    <Screen edges={['bottom']} onRefresh={refresh} refreshing={order.isRefetching || wallet.isRefetching || escrow.isRefetching}>
      <Card>
        <Text style={styles.muted}>{t('paymentScreen.ma_don')}: {o.orderNumber ?? o.orderId}</Text>
        <Text style={styles.text}>{o.title}</Text>
        <View style={styles.row}>
          <Text style={styles.muted}>{t('paymentScreen.so_tien_thanh_toan')}</Text>
          <Text testID="payment-amount" style={styles.amount}>{formatVnd(total)}</Text>
        </View>
        {deadline ? <Text style={styles.muted}>{t('paymentScreen.han_thanh_toan_don_se', { p0: formatDateTime(deadline.toISOString()) })}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.text}>{t('checkoutScreen.workgo_wallet')}</Text>
        {balance !== undefined && (
          <View style={styles.row}>
            <Text style={styles.muted}>{t('paymentScreen.wallet_balance')}</Text>
            <Text style={styles.text}>{formatVnd(balance)}</Text>
          </View>
        )}
        {readError ? <ErrorState message={paymentErrorMessage(readError)} onRetry={refresh} /> : null}
        {pay.error ? <Text style={styles.error} accessibilityLiveRegion="polite">{paymentErrorMessage(pay.error)}</Text> : null}
        {shortage > 0 ? (
          <Button
            title={t('paymentScreen.top_up_shortage', { p0: formatVnd(shortage) })}
            disabled={!ready || pay.isPending}
            onPress={() => router.push({ pathname: '/payment/topup', params: { orderId, amount: String(shortage) } })}
          />
        ) : (
          <Button
            title={t('paymentScreen.thanh_toan', { p0: formatVnd(total) })}
            disabled={!ready || total <= 0}
            loading={pay.isPending}
            onPress={() => void once(() => pay.mutateAsync().catch(() => undefined))}
          />
        )}
      </Card>
      <Button title={t('paymentScreen.xem_don_hang')} variant="secondary" onPress={goToOrder} />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.small, color: colors.muted, flexShrink: 1 },
  amount: { fontSize: font.title, fontWeight: '700', color: colors.primaryDark },
  success: { fontSize: font.title, fontWeight: '700', color: colors.success },
  error: { fontSize: font.body, color: colors.danger },
}));
