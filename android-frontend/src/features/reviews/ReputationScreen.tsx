import { useMutation, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { providerApi } from '@/api/providerApi';
import { qk } from '@/api/queryKeys';
import { trustApi } from '@/api/trustApi';
import type { AppealReq, ReputationLedgerEntry } from '@/api/types';
import { Badge, Button, Card, font, makeStyles, Screen, spacing, TextField, useColors } from '@/ui';

type Props = {
  providerId?: string;
  onBack?: () => void;
};

export function ReputationScreen({ providerId: requestedProviderId, onBack }: Props) {
  const {claims,status}=useAuth();
  const profile=useQuery({queryKey:['ownProvider',claims?.userId],enabled:status==='signedIn',queryFn:async()=>(await providerApi.getMyProfile()).result});
  const providerId=requestedProviderId??profile.data?.providerProfileId??'';
  const styles = useStyles();
  const colors = useColors();

  const [showAppeal, setShowAppeal] = React.useState(false);
  const [appealRefId, setAppealRefId] = React.useState('');
  const [appealReason, setAppealReason] = React.useState('');
  const [appealExplanation, setAppealExplanation] = React.useState('');
  const [appealError, setAppealError] = React.useState<string | null>(null);
  const [appealSuccess, setAppealSuccess] = React.useState(false);

  const repQuery = useQuery({
    queryKey: qk.reputation(providerId),
    enabled:Boolean(providerId),
    queryFn: async () => (await trustApi.getProviderReputation(providerId)).result,
  });

  const appealMutation = useMutation({
    mutationFn: async () => {
      const body: AppealReq = {
        sanctionId: appealRefId.trim() || undefined,
        reason: appealReason.trim(),
        explanation: appealExplanation.trim(),
      };
      return (await trustApi.submitAppeal(body)).result;
    },
    onSuccess: () => {
      setAppealSuccess(true);
      setShowAppeal(false);
      setAppealRefId('');
      setAppealReason('');
      setAppealExplanation('');
      setAppealError(null);
    },
    onError: (err: Error) => {
      setAppealError(err.message || 'Không gửi được đơn kháng nghị.');
    },
  });

  const handleAppealSubmit = () => {
    if (!appealRefId || appealMutation.isPending) return;
    if (appealReason.trim().length < 20) {
      setAppealError('Lý do kháng nghị phải từ 20 ký tự trở lên!');
      return;
    }
    setAppealError(null);
    appealMutation.mutate();
  };

  const ledgerQuery=useQuery({queryKey:['reputationLedger',claims?.userId],enabled:status==='signedIn'&&Boolean(profile.data?.providerProfileId)&&providerId===profile.data?.providerProfileId,queryFn:async()=>(await trustApi.getReputationLedger()).result});
  const isOwner = status === 'signedIn' && Boolean(providerId) && providerId === profile.data?.providerProfileId;
  const scoreReviews = useQuery({queryKey:['providerScoreReviews',claims?.userId,providerId],enabled:isOwner,queryFn:async()=>(await trustApi.getProviderScoreReviews(providerId)).result});
  const sanctionQuery = useQuery({queryKey:['providerSanctions',claims?.userId,providerId],enabled:isOwner,queryFn:async()=>(await trustApi.getProviderSanctions(providerId)).result});
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const activeSanctions = (sanctionQuery.data ?? []).filter(row => !row.revokedAt && Date.parse(row.effectiveAt) <= now && (!row.expiresAt || Date.parse(row.expiresAt) > now));
  const score = repQuery.data?.score ?? null;
  const ledger:ReputationLedgerEntry[]=(ledgerQuery.data?.content??[]).map(e=>({id:e.id,timestamp:e.createdAt,event:e.kind,source:e.kind,delta:e.appliedDelta,balance:e.afterScore,referenceId:e.orderId,note:e.reason}));

  const getTier = (s: number) => {
    if (s >= 80) return { label: 'Hạng A — Xuất sắc', tone: 'success' as const, max: 'Tối đa 5 việc đồng thời sau giai đoạn Provider mới' };
    if (s >= 60) return { label: 'Hạng B — Tốt', tone: 'info' as const, max: 'Tối đa 3 việc đồng thời' };
    if (s >= 40) return { label: 'Hạng C — Trung bình', tone: 'warning' as const, max: 'Tối đa 2 việc đồng thời' };
    if (s >= 20) return { label: 'Hạng D — Cảnh báo', tone: 'danger' as const, max: 'Tối đa 1 việc đồng thời' };
    return { label: s < 5 ? 'Chờ xét điểm 0–4' : 'Phục hồi có giám sát', tone: 'danger' as const, max: 'Tạm dừng nhận việc mới; phục hồi cần quyết định SUPER_ADMIN' };
  };

  const tier = score===null?{label:'Chưa có dữ liệu uy tín',tone:'neutral' as const,max:'Chờ server xác minh'}:getTier(score);

  return (
    <Screen refreshing={repQuery.isRefetching || scoreReviews.isRefetching || sanctionQuery.isRefetching} onRefresh={() => {
      void repQuery.refetch();
      if (isOwner) { void ledgerQuery.refetch(); void scoreReviews.refetch(); void sanctionQuery.refetch(); }
    }}>
      {onBack ? (
        <Button title="← Quay lại" variant="secondary" onPress={onBack} />
      ) : null}

      {(repQuery.error||profile.error||ledgerQuery.error)&&<Text accessibilityRole="alert">{(repQuery.error??profile.error??ledgerQuery.error)?.message}</Text>}
      {/* Score Overview Card */}
      <Card style={styles.scoreCard}>
        <Text style={styles.title}>Chỉ số tín nhiệm Provider</Text>
        <Text style={styles.subtitle}>
          Hệ thống chấm điểm uy tín tự động phản ánh độ tin cậy và chất lượng dịch vụ của bạn trên WorkGo.
        </Text>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score ?? "?"}</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>

          <View style={styles.tierInfo}>
            <Badge label={tier.label} tone={tier.tone} />
            <Text style={styles.tierLimit}>Giới hạn theo điểm: {tier.max}. Provider mới tối đa 1 việc tới khi đủ 3 Order/3 CLIENT; server kiểm thêm nợ, chế tài và slot đang dùng.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quy chế tính điểm WorkGo:</Text>
        <View style={styles.rulesGrid}>
          <Text style={styles.ruleItem}>• Hoàn thành đơn hàng: <Text style={{ color: colors.success, fontWeight: '700' }}>Theo quote 2–5 điểm, có giới hạn</Text></Text>
          <Text style={styles.ruleItem}>• Đánh giá sao: <Text style={{ color: colors.success, fontWeight: '700' }}>Không trực tiếp cộng uy tín</Text></Text>
          <Text style={styles.ruleItem}>• Trễ hạn giao việc: <Text style={{ color: colors.danger, fontWeight: '700' }}>-n(n+1)/2 điểm</Text></Text>
          <Text style={styles.ruleItem}>• Tự ý bỏ dở việc: <Text style={{ color: colors.danger, fontWeight: '700' }}>-50 điểm</Text></Text>
          <Text style={styles.ruleItem}>• Kết luận lỗi năng lực: <Text style={{ color: colors.danger, fontWeight: '700' }}>-10 điểm</Text></Text>
        </View>
      </Card>

      {/* History Ledger Card */}
      <Card style={styles.ledgerCard}>
        <Text style={styles.cardTitle}>Sổ cái biến động uy tín (History Ledger)</Text>
        <Text style={styles.muted}>
          Ghi vết minh bạch mọi giao dịch cộng/trừ điểm kèm mã tham chiếu đơn hàng.
        </Text>

        <View style={styles.ledgerList}>
          {ledger.map((item) => (
            <View key={item.id} style={styles.ledgerItem}>
              <View style={styles.row}>
                <Text style={styles.ledgerEvent}>{item.event}</Text>
                <Text style={item.delta >= 0 ? styles.deltaPos : styles.deltaNeg}>
                  {item.delta >= 0 ? `+${item.delta}` : item.delta}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.metaText}>Mã: {item.referenceId} • {item.timestamp}</Text>
                <Text style={styles.metaText}>Số dư: {item.balance}/100</Text>
              </View>

              {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
            </View>
          ))}
        </View>
      </Card>

      {isOwner && <Card style={styles.ledgerCard}>
        <Text style={styles.cardTitle}>Lịch sử xét điểm 0–4</Text>
        {scoreReviews.isPending ? <Text>Đang tải lịch sử…</Text> : scoreReviews.error ? <Text accessibilityRole="alert">{scoreReviews.error.message}</Text> : <>
          {!scoreReviews.data?.length && <Text>Chưa có kết luận xét điểm.</Text>}
          {scoreReviews.data?.map(row => <View key={row.reviewId}>
            <Text>{row.outcome === 'BAN_PROVIDER' ? 'Cấm hoạt động Provider' : 'Tiếp tục hạn chế nhận việc'}</Text>
            <Text>Điểm {row.score} · Phiên bản {row.sourceVersion} · {row.reviewedAt}</Text>
            <Text>{row.reason} · Hồ sơ: {row.reference}</Text>
            {row.sanctionId && <Text>Chế tài: {row.sanctionId}</Text>}
          </View>)}
          <Text>Kết luận không tự tăng điểm hoặc mở quyền nhận việc.</Text>
        </>}
      </Card>}

      {isOwner && <Card style={styles.sanctionCard}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Chế tài & Kháng nghị</Text>
          <Badge label={sanctionQuery.isPending || sanctionQuery.error ? 'Chưa xác minh chế tài' : activeSanctions.length ? 'Có chế tài đang hiệu lực' : 'Không có chế tài đang hiệu lực'} tone={sanctionQuery.isPending || sanctionQuery.error ? 'neutral' : activeSanctions.length ? 'danger' : 'success'} />
        </View>
        {sanctionQuery.error && <Text accessibilityRole="alert">{sanctionQuery.error.message}</Text>}
        {sanctionQuery.data?.map(row => <View key={row.id}>
          <Text>{row.scope} · {row.reason}</Text><Text>Hồ sơ: {row.reference} · Hiệu lực: {row.effectiveAt}</Text>
          <Text>{row.revokedAt ? `Đã gỡ: ${row.revokedAt}` : row.expiresAt ? `Hết hạn: ${row.expiresAt}` : 'Không có ngày hết hạn'}</Text>
          {!row.revokedAt && now >= Date.parse(row.effectiveAt) && now <= Date.parse(row.effectiveAt) + 7 * 86400000 && <Button title="Kháng nghị chế tài này" variant="secondary" onPress={() => { setAppealRefId(row.id); setShowAppeal(true); setAppealError(null); setAppealSuccess(false); }} />}
        </View>)}

        {appealSuccess ? (
          <Text style={[styles.bodyText, { color: colors.success, fontWeight: '700' }]}>
            ✓ Đã nhận biên nhận kháng nghị. Mục tiêu xem xét trong 3 ngày làm việc.
          </Text>
        ) : null}


        {showAppeal ? (
          <View style={styles.appealForm}>
            <Text style={styles.sectionTitle}>Đơn kháng nghị tới Ban Quản Trị:</Text>

            <Text>Chế tài: {appealRefId}</Text>

            <TextField
              label="Lý do kháng nghị (tối thiểu 20 ký tự)"
              placeholder="Lý do bạn không đồng ý với kết luận..."
              value={appealReason}
              onChangeText={setAppealReason}
            />

            <TextField
              label="Giải trình chi tiết"
              placeholder="Cung cấp diễn biến thực tế, nguyên nhân khách quan..."
              value={appealExplanation}
              onChangeText={setAppealExplanation}
              multiline
              numberOfLines={3}
            />


            {appealError ? <Text style={styles.errorText}>{appealError}</Text> : null}

            <View style={styles.row}>
              <Button
                title="Gửi đơn kháng nghị"
                loading={appealMutation.isPending}
                onPress={handleAppealSubmit}
              />
              <Button
                title="Hủy"
                variant="secondary"
                onPress={() => setShowAppeal(false)}
              />
            </View>
          </View>
        ) : null}
      </Card>}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  scoreCard: { gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: font.small, color: colors.muted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.sm },
  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 36 },
  scoreMax: { fontSize: font.small - 1, color: colors.muted },
  tierInfo: { gap: spacing.xs, flex: 1 },
  tierLimit: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  sectionTitle: { fontSize: font.body, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  rulesGrid: { gap: 4, paddingLeft: spacing.xs },
  ruleItem: { fontSize: font.small, color: colors.text },
  ledgerCard: { gap: spacing.sm },
  cardTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  ledgerList: { gap: spacing.sm, marginTop: spacing.xs },
  ledgerItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border, gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ledgerEvent: { fontSize: font.body, fontWeight: '600', color: colors.text, flex: 1 },
  deltaPos: { fontSize: font.body, fontWeight: '700', color: colors.success },
  deltaNeg: { fontSize: font.body, fontWeight: '700', color: colors.danger },
  metaText: { fontSize: font.small - 1, color: colors.muted },
  noteText: { fontSize: font.small - 1, color: colors.muted, fontStyle: 'italic' },
  sanctionCard: { gap: spacing.md },
  bodyText: { fontSize: font.body, color: colors.text },
  appealForm: { gap: spacing.sm, marginTop: spacing.xs },
  errorText: { fontSize: font.small, color: colors.danger },
  muted: { fontSize: font.small, color: colors.muted },
}));
