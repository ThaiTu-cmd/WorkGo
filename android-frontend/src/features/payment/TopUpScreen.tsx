import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '@/auth/AuthProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { paymentErrorMessage } from '@/api/errors';
import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { PaymentGateway, TopUpDto } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { useT } from '@/i18n';
import { formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import {
  Button,
  Card,
  Chip,
  font,
  makeStyles,
  Screen,
  spacing,
  TextField,
  useColors,
} from '@/ui';

import { MOCK_PAYMENT_ENABLED, newIdempotencyKey } from './payment';

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const MIN_TOP_UP_AMOUNT = 10000;

export function TopUpScreen() {
  const {claims,status}=useAuth();
  const params=useLocalSearchParams<{topUpId?:string}>();
  return <TopUpSession key={status+':'+(claims?.userId??'')+':'+(params.topUpId??'')} />;
}

function TopUpSession() {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const signedIn = useRequireAuth();
  const {claims}=useAuth();const storageKey='workgo.topup.pending:'+(claims?.userId??'');
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ amount?: string; orderId?: string; topUpId?: string; fromAmendment?: string }>();
  const once = useSingleFlight();

  const [amountRaw, setAmountRaw] = React.useState(() => {
    if (params.amount && Number(params.amount) > 0) return String(Math.max(MIN_TOP_UP_AMOUNT, Number(params.amount)));
    return '500000';
  });
  const [gateway, setGateway] = React.useState<PaymentGateway>('VNPAY');
  const [error, setError] = React.useState<string | null>(null);

  const [activeTopUpId, setActiveTopUpId] = React.useState(params.topUpId || '');
  const attempt = React.useRef<{ amount: number; gateway: PaymentGateway; key: string } | null>(null);
  const topUp = useQuery({
    queryKey: qk.topUp(activeTopUpId),
    enabled: signedIn && !!activeTopUpId,
    queryFn: async () => (await paymentApi.getTopUp(activeTopUpId)).result,
    refetchInterval: ({ state }) => {
      const status = state.data?.status;
      return status !== 'SUCCEEDED' && status !== 'FAILED' && state.dataUpdateCount < 20 ? 3000 : false;
    },
  });
  const topUpStatus = topUp.data?.status;
  React.useEffect(()=>{let active=true;
    AsyncStorage.getItem(storageKey).then(raw=>{if(!active||!raw)return;const saved=JSON.parse(raw);
      if(saved?.key&&Number.isSafeInteger(saved.amount)&&['VNPAY','MOMO','MOCK'].includes(saved.gateway)){
        attempt.current={amount:saved.amount,gateway:saved.gateway,key:saved.key};setAmountRaw(String(saved.amount));setGateway(saved.gateway);if(saved.topUpId)setActiveTopUpId(saved.topUpId);
      }
    }).catch(()=>undefined);return()=>{active=false;};
  },[storageKey,params.topUpId]);


  React.useEffect(() => {
    if (topUpStatus === 'SUCCEEDED') {
      void AsyncStorage.removeItem(storageKey);
      void queryClient.invalidateQueries({ queryKey: qk.wallet() });
      void queryClient.invalidateQueries({ queryKey: qk.walletLedger() });
    }
  }, [topUpStatus, queryClient, storageKey]);

  const openGateway = async (item: TopUpDto) => {
    if (!item.paymentUrl) return;
    try {
      setError(null);
      await WebBrowser.openBrowserAsync(item.paymentUrl);
    } catch (err) {
      setError(paymentErrorMessage(err));
    } finally {
      void queryClient.invalidateQueries({ queryKey: qk.topUp(item.topUpId) });
    }
  };

  const topUpMutation = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      const amt = Number(amountRaw.trim());
      if (!/^\d+$/.test(amountRaw.trim()) || !Number.isSafeInteger(amt)) {
        throw new Error(t('paymentScreen.invalid_top_up_amount'));
      }
      if (amt < MIN_TOP_UP_AMOUNT) throw new Error(t('paymentScreen.minimum_top_up_amount', { p0: formatVnd(MIN_TOP_UP_AMOUNT) }));
      if (attempt.current?.amount !== amt || attempt.current.gateway !== gateway) {
        attempt.current = { amount: amt, gateway, key: newIdempotencyKey() };
      }
      await AsyncStorage.setItem(storageKey,JSON.stringify(attempt.current));
      const res = await paymentApi.createTopUp(
        {
          amount: amt,
          gateway,
          paymentMethod: gateway === 'MOMO' ? 'WALLET' : 'QR',
        },
        attempt.current.key
      );
      if(!res.result?.topUpId)throw new Error('Missing top-up receipt');
      await AsyncStorage.setItem(storageKey,JSON.stringify({...attempt.current,topUpId:res.result.topUpId}));
      return res.result;
    },
    onSuccess: async (data) => {
      setError(null);
      queryClient.setQueryData(qk.topUp(data.topUpId), data);
      setActiveTopUpId(data.topUpId);
      router.setParams({ topUpId: data.topUpId });

      if (data.gateway !== 'MOCK' && (data.status === 'INITIATED' || data.status === 'PENDING')) await openGateway(data);
    },
    onError: (err) => {
      setError(paymentErrorMessage(err));
    },
  });

  const simulate = useMutation({
    networkMode: 'always',
    mutationFn: async ({ item, success }: { item: TopUpDto; success: boolean }) => (await paymentApi.simulateMockTopUp(item.topUpCode, success)).result,
    onSuccess: (item) => queryClient.setQueryData(qk.topUp(item.topUpId), item),
    onError: (err) => setError(paymentErrorMessage(err)),
  });
  const returnAfterTopUp = () => {
    if (!params.orderId) return router.replace('/payment/wallet');
    if (router.canGoBack()) return router.back();
    if (params.fromAmendment === '1') return router.replace({ pathname: '/orders/[id]', params: { id: params.orderId, role: 'CLIENT' } });
    router.replace({ pathname: '/payment/[orderId]', params: { orderId: params.orderId } });
  };

  if (!signedIn) {
    return (
      <Screen>
        <LoginRequired message="Vui lòng đăng nhập để nạp tiền vào ví." />
      </Screen>
    );
  }

  return (
    <Screen>
      {topUp.data?.gateway==='MOCK'&&<Text>Sandbox TEST_VND: no spendable wallet credit.</Text>}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Nạp tiền vào ví</Text>
          <Text style={styles.sub}>
            Tiền nạp được cộng trực tiếp vào số dư khả dụng và dùng để thanh toán dịch vụ hoặc nạp bù dư nợ.
          </Text>
        </View>

        {activeTopUpId ? (
          <Card style={styles.statusCard}>
            {topUpStatus === 'PENDING' || topUpStatus === 'INITIATED' ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.statusTitle}>Đang xử lý giao dịch nạp tiền</Text>
                <Text style={styles.statusDesc}>
                  {t('paymentScreen.gateway_connecting', { p0: topUp.data?.gateway ?? gateway })}
                </Text>
                {topUp.data?.gateway !== 'MOCK' && topUp.data?.paymentUrl ? (
                  <Button title={t('paymentScreen.mo_lai_trang_thanh_toan')} onPress={() => void once(() => openGateway(topUp.data))} />
                ) : null}
                <Button title={t('paymentScreen.kiem_tra_lai')} loading={topUp.isFetching} onPress={() => void topUp.refetch()} />
                {error && <Text accessibilityLiveRegion="polite">{error}</Text>}
                {MOCK_PAYMENT_ENABLED && topUp.data?.gateway === 'MOCK' ? (
                  <View style={styles.mockActions}>
                    <Button title="Giả lập nạp thành công (Dev)" loading={simulate.isPending} onPress={() => topUp.data && simulate.mutate({ item: topUp.data, success: true })} />
                    <Button title="Giả lập thất bại" disabled={simulate.isPending} variant="secondary" onPress={() => topUp.data && simulate.mutate({ item: topUp.data, success: false })} />
                  </View>
                ) : null}
              </View>
            ) : topUpStatus === 'UNKNOWN' ? (
              <View style={styles.centerBox}>
                <Ionicons name="alert-circle" size={48} color={colors.warning} />
                <Text style={[styles.statusTitle, { color: colors.warning }]}>
                  Giao dịch đang chờ đối soát (UNKNOWN)
                </Text>
                <Text style={styles.statusDesc}>
                  Kết quả từ ngân hàng đang được kiểm tra tự động để tránh trừ tiền 2 lần. Số dư ví sẽ được cập nhật sớm nhất.
                </Text>
                <Button title={t('paymentScreen.kiem_tra_lai')} loading={topUp.isFetching} onPress={() => void topUp.refetch()} />
                <Button title={params.orderId ? t('paymentScreen.return_to_order_payment') : 'Quay lại ví'} onPress={returnAfterTopUp} />
              </View>
            ) : topUpStatus === 'SUCCEEDED' ? (
              <View style={styles.centerBox}>
                <Ionicons name="checkmark-circle" size={52} color={colors.success} />
                <Text style={[styles.statusTitle, { color: colors.success }]}>Nạp tiền thành công!</Text>
                <Text style={styles.statusDesc}>
                  {t('paymentScreen.top_up_credited', { p0: formatVnd(Number(topUp.data?.amount)) })}
                </Text>
                <Button title={params.orderId ? t('paymentScreen.return_to_order_payment') : 'Xem số dư ví'} onPress={returnAfterTopUp} />
              </View>
            ) : topUpStatus === 'FAILED' ? (
              <View style={styles.centerBox}>
                <Ionicons name="close-circle" size={52} color={colors.danger} />
                <Text style={[styles.statusTitle, { color: colors.danger }]}>Giao dịch không thành công</Text>
                <Text style={styles.statusDesc}>Giao dịch nạp tiền đã bị hủy hoặc không được xử lý.</Text>
                <Button
                  title="Thử nạp lại"
                  onPress={() => {
                    setActiveTopUpId('');
                    router.setParams({ topUpId: '' });
                    attempt.current = null;
                  }}
                />
              </View>
            ) : (
              <View style={styles.centerBox}>
                {topUp.isError ? <Text style={styles.statusDesc}>{paymentErrorMessage(topUp.error)}</Text> : <ActivityIndicator color={colors.primary} />}
                <Button title={t('paymentScreen.kiem_tra_lai')} loading={topUp.isFetching} onPress={() => void topUp.refetch()} />
              </View>
            )}
          </Card>
        ) : (
          <>
            <Card style={styles.gatewaysCard}>
              <Text style={styles.cardTitle}>Chọn cổng thanh toán</Text>
              <View style={styles.gatewayRow}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.gatewayItem, gateway === 'VNPAY' && styles.gatewayItemActive]}
                  onPress={() => setGateway('VNPAY')}
                >
                  <Text style={[styles.gatewayLabel, gateway === 'VNPAY' && styles.gatewayLabelActive]}>
                    VNPay (QR/ATM)
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.gatewayItem, gateway === 'MOMO' && styles.gatewayItemActive]}
                  onPress={() => setGateway('MOMO')}
                >
                  <Text style={[styles.gatewayLabel, gateway === 'MOMO' && styles.gatewayLabelActive]}>
                    Ví MoMo
                  </Text>
                </Pressable>
                {MOCK_PAYMENT_ENABLED ? (
                  <Pressable
                    accessibilityRole="button"
                    style={[styles.gatewayItem, gateway === 'MOCK' && styles.gatewayItemActive]}
                    onPress={() => setGateway('MOCK')}
                  >
                    <Text style={[styles.gatewayLabel, gateway === 'MOCK' && styles.gatewayLabelActive]}>
                      Cổng Test
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </Card>

            <Card style={styles.amountCard}>
              <Text style={styles.cardTitle}>Chọn nhanh số tiền nạp</Text>
              <View style={styles.presetsGrid}>
                {PRESET_AMOUNTS.map((amt) => (
                  <Chip
                    key={amt}
                    label={formatVnd(amt)}
                    selected={amountRaw === String(amt)}
                    onPress={() => {
                      setAmountRaw(String(amt));
                      setError(null);
                    }}
                  />
                ))}
              </View>

              <TextField
                label={t('paymentScreen.enter_top_up_amount')}
                value={amountRaw}
                onChangeText={(val) => {
                  setAmountRaw(val);
                  setError(null);
                }}
                keyboardType="numeric"
                error={error ?? undefined}
              />

              <Button
                title={
                  Number(amountRaw) > 0
                    ? `Nạp ${formatVnd(Number(amountRaw))} ngay`
                    : 'Tiến hành nạp tiền'
                }
                loading={topUpMutation.isPending}
                onPress={() => void once(() => topUpMutation.mutateAsync().catch(() => undefined))}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: font.hero,
    fontWeight: '700',
    color: colors.text,
  },
  sub: {
    fontSize: font.small,
    color: colors.muted,
  },
  cardTitle: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  gatewaysCard: {
    gap: spacing.sm,
  },
  gatewayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gatewayItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatewayItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  gatewayLabel: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.text,
  },
  gatewayLabelActive: {
    color: colors.primary,
  },
  amountCard: {
    gap: spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing.sm,
  },
  statusTitle: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  statusDesc: {
    fontSize: font.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  mockActions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
}));
