import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { PayoutRequest, WalletDto } from '@/api/types';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { formatVnd } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { useT } from '@/i18n';
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

import { newIdempotencyKey } from './payment';

const MIN_PAYOUT_AMOUNT = 50000;
const POPULAR_BANKS = [{ name: 'Vietcombank', code: 'VCB' }, { name: 'MB Bank', code: 'MB' },
  { name: 'Techcombank', code: 'TCB' }, { name: 'BIDV', code: 'BIDV' }, { name: 'ACB', code: 'ACB' }, { name: 'VietinBank', code: 'CTG' }];

export function maskAccount(n: string): string {
  const digits = n.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

export function PayoutSettingsScreen() {
  const t = useT();
  const styles = useStyles();
  const colors = useColors();
  const signedIn = useRequireAuth();
  const queryClient = useQueryClient();
  const once = useSingleFlight();
  const [attempt, setAttempt] = React.useState<{ payload: string; key: string } | null>(null);

  const [bankName, setBankName] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [bankError, setBankError] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [numError, setNumError] = React.useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);
  const body: PayoutRequest = {
    amount: Number(withdrawAmount.trim()), bankCode: bankName.trim(),
    accountName: accountName.trim().toUpperCase(), accountNumber: accountNumber.trim(),
  };
  const payload = JSON.stringify(body);
  const isReplay = attempt?.payload === payload;

  const walletQuery = useQuery({
    queryKey: qk.wallet(),
    enabled: signedIn,
    queryFn: async () => {
      const res = await paymentApi.getWallet();
      return (res?.result ?? res) as WalletDto;
    },
  });

  const withdrawMutation = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      let hasErr = false;
      if (!bankName.trim()) {
        setBankError('Vui lòng nhập tên ngân hàng');
        hasErr = true;
      }
      if (!accountName.trim() || accountName.trim().length < 2) {
        setNameError('Vui lòng nhập tên chủ tài khoản từ 2 ký tự');
        hasErr = true;
      }
      const digits = accountNumber.trim();
      if (!/^\d{8,19}$/.test(digits)) {
        setNumError('Số tài khoản phải gồm 8-19 chữ số');
        hasErr = true;
      }
      if (hasErr) throw new Error('Dữ liệu không hợp lệ');

      const amt = Number(withdrawAmount.trim());
      const avail = walletQuery.data?.balance ?? 0;
      const debt = walletQuery.data?.outstandingFee ?? 0;

      if (!/^\d+$/.test(withdrawAmount.trim()) || !Number.isSafeInteger(amt) || amt < MIN_PAYOUT_AMOUNT) {
        setWithdrawError(t('payout.minimum', { p0: formatVnd(MIN_PAYOUT_AMOUNT) }));
        throw new Error('Số tiền không hợp lệ');
      }
      if (!isReplay && amt > avail) {
        setWithdrawError('Số tiền rút vượt quá số dư khả dụng');
        throw new Error('Vượt số dư');
      }
      if (!isReplay && debt > 0) {
        setWithdrawError('Tài khoản có dư nợ, không thể rút tiền');
        throw new Error('Có dư nợ');
      }
      const currentAttempt = attempt?.payload === payload ? attempt : { payload, key: newIdempotencyKey() };
      setAttempt(currentAttempt);
      return (await paymentApi.requestPayout(body, currentAttempt.key)).result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.wallet() });
      void queryClient.invalidateQueries({ queryKey: qk.walletLedger() });
      setWithdrawAmount('');
      setAttempt(null);
      Alert.alert('Thành công', 'Đã tạo lệnh rút tiền về tài khoản ngân hàng!');
    },
    onError: (err) => {
      Alert.alert('Lỗi', (err as Error)?.message || 'Không thể tạo yêu cầu rút tiền.');
    },
  });

  if (!signedIn) {
    return (
      <Screen>
        <LoginRequired message="Vui lòng đăng nhập để cài đặt tài khoản rút tiền." />
      </Screen>
    );
  }

  const avail = walletQuery.data?.balance ?? 0;
  const debt = walletQuery.data?.outstandingFee ?? 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt rút tiền</Text>
          <Text style={styles.sub}>
            Tiền thu nhập trong ví sẽ được chuyển về tài khoản ngân hàng thụ hưởng này khi bạn yêu cầu rút.
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Thông tin tài khoản ngân hàng</Text>

          <TextField
            label={t('payout.bank_code')}
            value={bankName}
            onChangeText={(val) => {
              setBankName(val);
              setBankError(null);
            }}
            placeholder="VCB"
            error={bankError ?? undefined}
          />

          <View style={styles.quickBanks}>
            {POPULAR_BANKS.map((b) => (
              <Chip
                key={b.code}
                label={b.name}
                selected={bankName === b.code}
                onPress={() => {
                  setBankName(b.code);
                  setBankError(null);
                }}
              />
            ))}
          </View>

          <TextField
            label="Tên chủ tài khoản (viết hoa không dấu)"
            value={accountName}
            onChangeText={(val) => {
              setAccountName(val.toUpperCase());
              setNameError(null);
            }}
            placeholder="NGUYEN VAN A"
            autoCapitalize="characters"
            error={nameError ?? undefined}
          />

          <TextField
            label="Số tài khoản ngân hàng"
            value={accountNumber}
            onChangeText={(val) => {
              setAccountNumber(val);
              setNumError(null);
            }}
            keyboardType="numeric"
            placeholder="0071001234567"
            error={numError ?? undefined}
          />

        </Card>

        {/* Withdrawal request section */}
          <Card style={styles.withdrawCard}>
            <Text style={styles.cardTitle}>Yêu cầu rút tiền về ngân hàng</Text>
            <View style={styles.availBox}>
              <Text style={styles.availLabel}>Số dư khả dụng có thể rút:</Text>
              <Text style={styles.availVal}>{formatVnd(avail)}</Text>
            </View>

            {debt > 0 ? (
              <View style={styles.debtAlert}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={styles.debtAlertText}>
                  Tài khoản đang có dư nợ {formatVnd(debt)}. Vui lòng nạp bù trước khi rút tiền.
                </Text>
              </View>
            ) : null}

            <TextField
              label={t('payout.amount', { p0: formatVnd(MIN_PAYOUT_AMOUNT) })}
              value={withdrawAmount}
              onChangeText={(val) => {
                setWithdrawAmount(val);
                setWithdrawError(null);
              }}
              keyboardType="numeric"
              placeholder="500000"
              error={withdrawError ?? undefined}
              editable={!withdrawMutation.isPending}
            />

            <Button
              title="Tạo lệnh rút tiền"
              variant="secondary"
              disabled={!isReplay && (!walletQuery.data || avail < MIN_PAYOUT_AMOUNT || debt > 0)}
              loading={withdrawMutation.isPending}
              onPress={() => { void once(() => withdrawMutation.mutateAsync().catch(() => undefined)); }}
            />
          </Card>
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
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#ebf8ff',
    borderColor: '#bee3f8',
    borderWidth: 1,
  },
  savedContent: {
    flex: 1,
    gap: 2,
  },
  savedTitle: {
    fontSize: font.small,
    color: colors.muted,
  },
  savedDesc: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.primary,
  },
  cardTitle: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  formCard: {
    gap: spacing.md,
  },
  quickBanks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  withdrawCard: {
    gap: spacing.md,
  },
  availBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  availLabel: {
    fontSize: font.small,
    color: colors.muted,
  },
  availVal: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.primary,
  },
  debtAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  debtAlertText: {
    flex: 1,
    fontSize: font.small,
    color: colors.danger,
  },
}));
