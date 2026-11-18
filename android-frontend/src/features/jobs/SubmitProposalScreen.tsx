import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { jobApi, type ProposalSubmitRequest } from '@/api/jobApi';
import { paymentApi } from '@/api/paymentApi';
import { providerApi } from '@/api/providerApi';
import { qk } from '@/api/queryKeys';
import { formatVnd } from '@/lib/format';
import { Button, Card, font, makeStyles, radius, spacing, TextField } from '@/ui';

export function SubmitProposalScreen({
  jobId: propJobId,
  onSuccess,
}: {
  jobId?: string;
  onSuccess?: () => void;
} = {}) {
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const activeJobId = propJobId || params.id || '';

  const [bidRaw, setBidRaw] = React.useState('');
  const [durationRaw, setDurationRaw] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [terms, setTerms] = React.useState('');

  // 1. Check Wallet Debt Guard
  const walletQuery = useQuery({
    queryKey: qk.wallet(),
    queryFn: async () => {
      const res = await paymentApi.getWallet();
      return res.result;
    },
  });

  const wallet = walletQuery.data;
  const isWalletBlocked = Boolean(wallet && (wallet.debtBalance > 0 || wallet.availableBalance < 0));
  const debtAmount = wallet?.debtBalance ?? 0;

  // 2. Check Provider Profile & Sanction Guard
  const profileQuery = useQuery({
    queryKey: qk.providerMe(),
    queryFn: async () => {
      const res = await providerApi.getMyProfile();
      return res.result;
    },
  });

  const profile = profileQuery.data;
  const isSanctionBlocked = Boolean(profile && profile.verificationStatus === 'SUSPENDED');

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const price = Number(bidRaw.replace(/[^\d]/g, ''));
      const estimatedDays = Number(durationRaw);
      const cleanMsg = message.trim();
      const cleanTerms = terms.trim();

      // Step 1: Apply to job
      let applicationId: string | null = null;
      try {
        const appRes = await jobApi.applyJob(activeJobId, { message: cleanMsg });
        applicationId = appRes.result?.applicationId ?? null;
      } catch (err: any) {
        // If already applied (409), look up existing application
        try {
          const myApps = await jobApi.getMyApplications({ page: 0, size: 50 });
          const existingApp = (myApps.result?.data ?? []).find(
            (a) => a.jobId === activeJobId
          );
          if (existingApp?.applicationId) {
            applicationId = existingApp.applicationId;
          } else {
            throw err;
          }
        } catch {
          throw err;
        }
      }

      if (!applicationId) {
        throw new Error('Không thể khởi tạo đơn ứng tuyển cho công việc này.');
      }

      // Step 2: Submit proposal
      const proposalPayload: ProposalSubmitRequest = {
        price,
        estimatedDays,
        message: cleanMsg,
        terms: cleanTerms || undefined,
      };

      const res = await jobApi.submitProposal(applicationId, proposalPayload);
      return res.result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.jobProposals(activeJobId) });
      void queryClient.invalidateQueries({ queryKey: qk.myApplications() });
      Alert.alert('Thành công', 'Đã gửi đề xuất báo giá của bạn!');
      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    },
    onError: (err: any) => {
      Alert.alert('Lỗi gửi đề xuất', err?.message || 'Không thể gửi đề xuất. Vui lòng kiểm tra lại.');
    },
  });

  // Validations
  const bidNum = Number(bidRaw.replace(/[^\d]/g, ''));
  const durationNum = Number(durationRaw);
  const isBidValid = Number.isFinite(bidNum) && bidNum >= 50_000 && bidNum <= 100_000_000;
  const isDurationValid = Number.isInteger(durationNum) && durationNum >= 1;
  const isMessageValid = message.trim().length >= 20;

  const isFormValid =
    isBidValid &&
    isDurationValid &&
    isMessageValid &&
    !isWalletBlocked &&
    !isSanctionBlocked;

  const handleSubmit = () => {
    if (isWalletBlocked) {
      Alert.alert('Công nợ ví', `Bạn đang có số dư nợ phí ${formatVnd(debtAmount)}. Vui lòng thanh toán nợ trước khi nhận việc mới.`);
      return;
    }
    if (isSanctionBlocked) {
      Alert.alert('Tài khoản bị giới hạn', 'Tài khoản chuyên gia đang bị chế tài (SUSPENDED). Vui lòng liên hệ hỗ trợ.');
      return;
    }
    if (!isFormValid) {
      Alert.alert('Chưa hợp lệ', 'Vui lòng kiểm tra báo giá (>= 50k), thời gian (>= 1 ngày) và thư ứng tuyển (>= 20 ký tự).');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.headerTitle}>Gửi Đề Xuất & Báo Giá</Text>
          <Text style={styles.headerSub}>Đề xuất mức giá cạnh tranh và thời gian thực hiện rõ ràng.</Text>

          {/* Guard 1: Negative Wallet Balance Banner */}
          {isWalletBlocked ? (
            <Card style={styles.debtBanner}>
              <View style={styles.bannerHeader}>
                <Ionicons name="warning-outline" size={20} color="#b91c1c" />
                <Text style={styles.debtTitle}>Cảnh báo nợ ví ({formatVnd(debtAmount)})</Text>
              </View>
              <Text style={styles.bannerDesc}>
                Theo quy chế WorkGo, bạn cần thanh toán công nợ phí dịch vụ trước khi gửi báo giá hoặc nhận việc mới.
              </Text>
            </Card>
          ) : null}

          {/* Guard 2: Sanction Banner */}
          {isSanctionBlocked ? (
            <Card style={styles.sanctionBanner}>
              <View style={styles.bannerHeader}>
                <Ionicons name="shield-outline" size={20} color="#991b1b" />
                <Text style={styles.sanctionTitle}>Tài khoản đang bị chế tài</Text>
              </View>
              <Text style={styles.bannerDesc}>
                Hồ sơ chuyên gia đang ở trạng thái tạm ngừng (SUSPENDED). Bạn không thể gửi đề xuất nhận việc trong thời gian này.
              </Text>
            </Card>
          ) : null}

          <TextField
            label="Mức giá đề xuất (VNĐ) *"
            placeholder="Ví dụ: 2000000"
            keyboardType="numeric"
            value={bidRaw}
            onChangeText={setBidRaw}
          />

          <TextField
            label="Thời gian thực hiện (ngày) *"
            placeholder="Ví dụ: 3"
            keyboardType="numeric"
            value={durationRaw}
            onChangeText={setDurationRaw}
          />

          <TextField
            label="Thư ứng tuyển / Lời nhắn (tối thiểu 20 ký tự) *"
            placeholder="Giới thiệu kinh nghiệm, phương án triển khai..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <TextField
            label="Cam kết & Điều khoản thực hiện (tuỳ chọn)"
            placeholder="Ví dụ: Bảo hành 1 tháng, sửa tối đa 3 lần..."
            value={terms}
            onChangeText={setTerms}
            multiline
            numberOfLines={2}
          />

          <Button
            title="Gửi Báo Giá & Đề Xuất"
            loading={submitMutation.isPending}
            disabled={!isFormValid || submitMutation.isPending}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, gap: spacing.md },
  headerTitle: { fontSize: font.title, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: font.small, color: colors.muted, marginTop: -spacing.xs },
  debtBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sanctionBanner: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  debtTitle: { fontSize: font.body, fontWeight: '700', color: '#b91c1c' },
  sanctionTitle: { fontSize: font.body, fontWeight: '700', color: '#991b1b' },
  bannerDesc: { fontSize: font.small, color: '#7f1d1d', lineHeight: 18 },
}));
