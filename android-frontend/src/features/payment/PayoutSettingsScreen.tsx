import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import type { PayoutSettingsDto, WalletDto } from '@/api/types';
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

import { newIdempotencyKey } from './payment';

const POPULAR_BANKS = ['Vietcombank', 'MB Bank', 'Techcombank', 'BIDV', 'ACB', 'VietinBank'];

export function maskAccount(n: string): string {
  const digits = n.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

export function PayoutSettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const signedIn = useRequireAuth();
  const queryClient = useQueryClient();

  const [bankName, setBankName] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [bankError, setBankError] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [numError, setNumError] = React.useState<string | null>(null);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: qk.payoutSettings(),
    enabled: signedIn,
    queryFn: async () => {
      const res = await paymentApi.getPayoutSettings();
      return (res?.result ?? res) as PayoutSettingsDto;
    },
  });

  const walletQuery = useQuery({
    queryKey: qk.wallet(),
    enabled: signedIn,
    queryFn: async () => {
      const res = await paymentApi.getWallet();
      return (res?.result ?? res) as WalletDto;
    },
  });

  React.useEffect(() => {
    const data = settingsQuery.data;
    if (data) {
      const timer = setTimeout(() => {
        if (data.bankName) setBankName(data.bankName);
        if (data.accountName) setAccountName(data.accountName);
        if (data.accountNumber) setAccountNumber(data.accountNumber);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
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
      const digits = accountNumber.replace(/\D/g, '');
      if (!/^\d{8,19}$/.test(digits)) {
        setNumError('Số tài khoản phải gồm 8-19 chữ số');
        hasErr = true;
      }
      if (hasErr) throw new Error('Dữ liệu không hợp lệ');

      await paymentApi.savePayoutSettings({
        bankName: bankName.trim(),
        accountName: accountName.trim().toUpperCase(),
        accountNumber: digits,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.payoutSettings() });
      Alert.alert('Thành công', 'Đã lưu thông tin tài khoản rút tiền!');
    },
    onError: (err) => {
      Alert.alert('Lỗi', (err as Error)?.message || 'Không thể lưu cài đặt.');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(String(withdrawAmount).replace(/[^\d]/g, ''));
      const avail = Number(walletQuery.data?.availableBalance ?? 0);
      const debt = Number(walletQuery.data?.debtBalance ?? 0);

      if (!Number.isFinite(amt) || amt < 100000) {
        setWithdrawError('Số tiền rút tối thiểu là 100.000 ₫');
        throw new Error('Số tiền không hợp lệ');
      }
      if (amt > avail) {
        setWithdrawError('Số tiền rút vượt quá số dư khả dụng');
        throw new Error('Vượt số dư');
      }
      if (debt > 0) {
        setWithdrawError('Tài khoản có dư nợ, không thể rút tiền');
        throw new Error('Có dư nợ');
      }
      if (!accountNumber) {
        setWithdrawError('Vui lòng lưu thông tin tài khoản ngân hàng trước');
        throw new Error('Chưa lưu ngân hàng');
      }

      await paymentApi.requestPayout(
        {
          amount: amt,
          bankName,
          accountName,
          accountNumber,
        },
        newIdempotencyKey()
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.wallet() });
      void queryClient.invalidateQueries({ queryKey: qk.walletLedger() });
      setWithdrawAmount('');
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

  const avail = Number(walletQuery.data?.availableBalance ?? 0);
  const debt = Number(walletQuery.data?.debtBalance ?? 0);
  const savedAccount = settingsQuery.data?.accountNumber ? maskAccount(settingsQuery.data.accountNumber) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt rút tiền</Text>
          <Text style={styles.sub}>
            Tiền thu nhập trong ví sẽ được chuyển về tài khoản ngân hàng thụ hưởng này khi bạn yêu cầu rút.
          </Text>
        </View>

        {savedAccount ? (
          <Card style={styles.savedCard}>
            <Ionicons name="card" size={24} color={colors.primary} />
            <View style={styles.savedContent}>
              <Text style={styles.savedTitle}>Tài khoản thụ hưởng hiện tại</Text>
              <Text style={styles.savedDesc}>
                {settingsQuery.data?.bankName} — {savedAccount} ({settingsQuery.data?.accountName})
              </Text>
            </View>
          </Card>
        ) : null}

        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Thông tin tài khoản ngân hàng</Text>

          <TextField
            label="Tên ngân hàng"
            value={bankName}
            onChangeText={(val) => {
              setBankName(val);
              setBankError(null);
            }}
            placeholder="Ví dụ: Vietcombank"
            error={bankError ?? undefined}
          />

          <View style={styles.quickBanks}>
            {POPULAR_BANKS.map((b) => (
              <Chip
                key={b}
                label={b}
                selected={bankName === b}
                onPress={() => {
                  setBankName(b);
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

          <Button
            title="Lưu thông tin ngân hàng"
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          />
        </Card>

        {/* Withdrawal request section */}
        {savedAccount ? (
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
              label="Số tiền muốn rút (tối thiểu 100.000 ₫)"
              value={withdrawAmount}
              onChangeText={(val) => {
                setWithdrawAmount(val);
                setWithdrawError(null);
              }}
              keyboardType="numeric"
              placeholder="500000"
              error={withdrawError ?? undefined}
              editable={avail >= 100000 && debt === 0}
            />

            <Button
              title="Tạo lệnh rút tiền"
              variant="secondary"
              disabled={avail < 100000 || debt > 0}
              loading={withdrawMutation.isPending}
              onPress={() => withdrawMutation.mutate()}
            />
          </Card>
        ) : null}
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
