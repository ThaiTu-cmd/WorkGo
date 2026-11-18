import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { formatVnd } from '@/lib/format';
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

export function TopUpScreen() {
  const styles = useStyles();
  const colors = useColors();
  const router = useRouter();
  const signedIn = useRequireAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ amount?: string }>();

  const [amountRaw, setAmountRaw] = React.useState(() => {
    if (params.amount && Number(params.amount) > 0) return params.amount;
    return '500000';
  });
  const [gateway, setGateway] = React.useState<PaymentGateway>('VNPAY');
  const [error, setError] = React.useState<string | null>(null);

  // Active top-up transaction tracking & UNKNOWN polling
  const [activeTopUpId, setActiveTopUpId] = React.useState<string | null>(null);
  const [topUpStatus, setTopUpStatus] = React.useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = React.useState<number>(0);
  const [pollCount, setPollCount] = React.useState<number>(0);
  const pollTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pollTopUpRef = React.useRef<(id: string) => Promise<void>>(async () => {});

  const pollTopUp = React.useCallback(async (id: string) => {
    try {
      const res = await paymentApi.getTopUp(id);
      const data = (res?.result ?? res) as TopUpDto;
      setTopUpStatus(data.status);
      if (data.amount) setTopUpAmount(Number(data.amount));

      if (data.status === 'SUCCESS') {
        void queryClient.invalidateQueries({ queryKey: qk.wallet() });
        void queryClient.invalidateQueries({ queryKey: qk.walletLedger() });
        return;
      }
      if (data.status === 'FAILED') {
        return;
      }

      setPollCount((prev) => {
        const next = prev + 1;
        if (next < 20) {
          pollTimerRef.current = setTimeout(() => {
            void pollTopUpRef.current(id);
          }, 2500);
        }
        return next;
      });
    } catch {
      setPollCount((prev) => {
        const next = prev + 1;
        if (next < 20) {
          pollTimerRef.current = setTimeout(() => {
            void pollTopUpRef.current(id);
          }, 3000);
        }
        return next;
      });
    }
  }, [queryClient]);

  React.useEffect(() => {
    pollTopUpRef.current = pollTopUp;
  }, [pollTopUp]);

  React.useEffect(() => {
    if (activeTopUpId && (topUpStatus === 'PENDING' || topUpStatus === 'INITIATED' || topUpStatus === 'UNKNOWN')) {
      const t = setTimeout(() => {
        void pollTopUp(activeTopUpId);
      }, 0);
      return () => {
        clearTimeout(t);
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      };
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [activeTopUpId, topUpStatus, pollTopUp]);

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(String(amountRaw).replace(/[^\d]/g, ''));
      if (!Number.isFinite(amt) || amt < 50000) {
        throw new Error('Số tiền nạp tối thiểu là 50.000 ₫');
      }
      if (amt > 100000000) {
        throw new Error('Số tiền nạp tối đa là 100.000.000 ₫');
      }

      setTopUpAmount(amt);
      const res = await paymentApi.createTopUp(
        {
          amount: amt,
          gateway,
          paymentMethod: gateway === 'MOMO' ? 'WALLET' : 'QR',
        },
        newIdempotencyKey()
      );
      return (res?.result ?? res) as TopUpDto;
    },
    onSuccess: async (data) => {
      setActiveTopUpId(data.topUpId);
      setTopUpStatus(data.status ?? 'PENDING');
      setPollCount(0);

      if (gateway !== 'MOCK' && data.paymentUrl) {
        await WebBrowser.openBrowserAsync(data.paymentUrl);
        // User closed browser, check status immediately
        void pollTopUp(data.topUpId);
      }
    },
    onError: (err) => {
      setError(paymentErrorMessage(err));
    },
  });

  const handleSimulateMock = async (success: boolean) => {
    if (!activeTopUpId) return;
    try {
      await paymentApi.simulateMock(activeTopUpId, success);
      setTopUpStatus(success ? 'SUCCESS' : 'FAILED');
      void queryClient.invalidateQueries({ queryKey: qk.wallet() });
      void queryClient.invalidateQueries({ queryKey: qk.walletLedger() });
    } catch {
      setTopUpStatus(success ? 'SUCCESS' : 'FAILED');
    }
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Nạp tiền vào ví</Text>
          <Text style={styles.sub}>
            Tiền nạp được cộng trực tiếp vào số dư khả dụng và dùng để thanh toán dịch vụ hoặc nạp bù dư nợ.
          </Text>
        </View>

        {activeTopUpId && topUpStatus ? (
          <Card style={styles.statusCard}>
            {topUpStatus === 'PENDING' || topUpStatus === 'INITIATED' ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.statusTitle}>Đang xử lý giao dịch nạp tiền</Text>
                <Text style={styles.statusDesc}>
                  Hệ thống đang kết nối với cổng {gateway}. Vui lòng chờ trong giây lát ({pollCount + 1}/20)...
                </Text>
                {MOCK_PAYMENT_ENABLED || gateway === 'MOCK' ? (
                  <View style={styles.mockActions}>
                    <Button title="Giả lập nạp thành công (Dev)" onPress={() => void handleSimulateMock(true)} />
                    <Button title="Giả lập thất bại" variant="secondary" onPress={() => void handleSimulateMock(false)} />
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
                <Button title="Quay lại ví" onPress={() => router.replace('/payment/wallet')} />
              </View>
            ) : topUpStatus === 'SUCCESS' ? (
              <View style={styles.centerBox}>
                <Ionicons name="checkmark-circle" size={52} color={colors.success} />
                <Text style={[styles.statusTitle, { color: colors.success }]}>Nạp tiền thành công!</Text>
                <Text style={styles.statusDesc}>
                  Đã cộng {formatVnd(topUpAmount)} vào số dư khả dụng của bạn.
                </Text>
                <Button title="Xem số dư ví" onPress={() => router.replace('/payment/wallet')} />
              </View>
            ) : (
              <View style={styles.centerBox}>
                <Ionicons name="close-circle" size={52} color={colors.danger} />
                <Text style={[styles.statusTitle, { color: colors.danger }]}>Giao dịch không thành công</Text>
                <Text style={styles.statusDesc}>Giao dịch nạp tiền đã bị hủy hoặc không được xử lý.</Text>
                <Button
                  title="Thử nạp lại"
                  onPress={() => {
                    setActiveTopUpId(null);
                    setTopUpStatus(null);
                  }}
                />
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
                label="Hoặc nhập số tiền khác (tối thiểu 50.000 ₫)"
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
                onPress={() => topUpMutation.mutate()}
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
    backgroundColor: '#ebf8ff',
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
