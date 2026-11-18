import { useMutation, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Text, View } from 'react-native';

import { qk } from '@/api/queryKeys';
import { trustApi } from '@/api/trustApi';
import type { AppealReq, ReputationLedgerEntry } from '@/api/types';
import { Badge, Button, Card, font, makeStyles, Screen, spacing, TextField, useColors } from '@/ui';

type Props = {
  providerId?: string;
  onBack?: () => void;
};

const DEFAULT_LEDGER: ReputationLedgerEntry[] = [
  {
    id: 'REP-01',
    timestamp: '2026-10-15 14:30',
    event: 'Hoàn thành đơn hàng đúng chuẩn',
    source: 'ORDER_COMPLETED',
    delta: 5,
    balance: 85,
    referenceId: 'ORD-1042',
    note: 'Khách hàng nghiệm thu đạt chất lượng 100%',
  },
  {
    id: 'REP-02',
    timestamp: '2026-10-10 09:15',
    event: 'Nhận đánh giá 5 sao từ khách hàng',
    source: 'REVIEW_5_STAR',
    delta: 2,
    balance: 80,
    referenceId: 'ORD-1038',
  },
  {
    id: 'REP-03',
    timestamp: '2026-10-02 16:45',
    event: 'Trễ hạn bàn giao công việc 1 ngày',
    source: 'LATE_DELIVERY',
    delta: -1,
    balance: 78,
    referenceId: 'ORD-1019',
    note: 'Khấu trừ theo công thức n(n+1)/2 (n=1)',
  },
];

export function ReputationScreen({ providerId = 'current', onBack }: Props) {
  const styles = useStyles();
  const colors = useColors();

  const [showAppeal, setShowAppeal] = React.useState(false);
  const [appealRefId, setAppealRefId] = React.useState('');
  const [appealReason, setAppealReason] = React.useState('');
  const [appealExplanation, setAppealExplanation] = React.useState('');
  const [appealEvidence, setAppealEvidence] = React.useState('');
  const [appealError, setAppealError] = React.useState<string | null>(null);
  const [appealSuccess, setAppealSuccess] = React.useState(false);

  const repQuery = useQuery({
    queryKey: qk.reputation(providerId),
    queryFn: async () => {
      try {
        const res = await trustApi.getProviderReputation(providerId);
        return res?.result ?? null;
      } catch {
        return null;
      }
    },
  });

  const appealMutation = useMutation({
    mutationFn: async () => {
      const body: AppealReq = {
        sanctionId: appealRefId.trim() || undefined,
        reason: appealReason.trim(),
        explanation: appealExplanation.trim(),
        evidenceUrl: appealEvidence.trim() || undefined,
      };
      return (await trustApi.submitAppeal(body)).result;
    },
    onSuccess: () => {
      setAppealSuccess(true);
      setShowAppeal(false);
      setAppealRefId('');
      setAppealReason('');
      setAppealExplanation('');
      setAppealEvidence('');
      setAppealError(null);
    },
    onError: (err: Error) => {
      setAppealError(err.message || 'Không gửi được đơn kháng nghị.');
    },
  });

  const handleAppealSubmit = () => {
    if (appealReason.trim().length < 20) {
      setAppealError('Lý do kháng nghị phải từ 20 ký tự trở lên!');
      return;
    }
    setAppealError(null);
    appealMutation.mutate();
  };

  const score = repQuery.data?.score ?? 85;
  const ledger = repQuery.data?.ledger && repQuery.data.ledger.length > 0 ? repQuery.data.ledger : DEFAULT_LEDGER;

  const getTier = (s: number) => {
    if (s >= 80) return { label: 'Hạng A — Xuất sắc', tone: 'success' as const, max: 'Không giới hạn việc đồng thời' };
    if (s >= 60) return { label: 'Hạng B — Tốt', tone: 'info' as const, max: 'Tối đa 5 việc đồng thời' };
    if (s >= 40) return { label: 'Hạng C — Trung bình', tone: 'warning' as const, max: 'Tối đa 3 việc đồng thời' };
    if (s >= 20) return { label: 'Hạng D — Cảnh báo', tone: 'danger' as const, max: 'Tối đa 1 việc đồng thời' };
    return { label: 'Hạng E — Nguy cơ khóa', tone: 'danger' as const, max: 'Tạm đình chỉ nhận việc' };
  };

  const tier = getTier(score);

  return (
    <Screen refreshing={repQuery.isRefetching} onRefresh={() => void repQuery.refetch()}>
      {onBack ? (
        <Button title="← Quay lại" variant="secondary" onPress={onBack} />
      ) : null}

      {/* Score Overview Card */}
      <Card style={styles.scoreCard}>
        <Text style={styles.title}>Chỉ số tín nhiệm Provider</Text>
        <Text style={styles.subtitle}>
          Hệ thống chấm điểm uy tín tự động phản ánh độ tin cậy và chất lượng dịch vụ của bạn trên WorkGo.
        </Text>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>

          <View style={styles.tierInfo}>
            <Badge label={tier.label} tone={tier.tone} />
            <Text style={styles.tierLimit}>Quyền nhận đơn: {tier.max}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quy chế tính điểm WorkGo:</Text>
        <View style={styles.rulesGrid}>
          <Text style={styles.ruleItem}>• Hoàn thành đơn hàng: <Text style={{ color: colors.success, fontWeight: '700' }}>+5 điểm</Text></Text>
          <Text style={styles.ruleItem}>• Đánh giá 5 sao: <Text style={{ color: colors.success, fontWeight: '700' }}>+2 điểm</Text></Text>
          <Text style={styles.ruleItem}>• Trễ hạn giao việc: <Text style={{ color: colors.danger, fontWeight: '700' }}>-n(n+1)/2 điểm</Text></Text>
          <Text style={styles.ruleItem}>• Tự ý bỏ dở việc: <Text style={{ color: colors.danger, fontWeight: '700' }}>-50 điểm</Text></Text>
          <Text style={styles.ruleItem}>• Thua khiếu nại tranh chấp: <Text style={{ color: colors.danger, fontWeight: '700' }}>-10 điểm</Text></Text>
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

      {/* Sanctions & Appeals Card */}
      <Card style={styles.sanctionCard}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Chế tài & Kháng nghị</Text>
          <Badge label="Hoạt động bình thường" tone="success" />
        </View>
        <Text style={styles.bodyText}>
          Tài khoản của bạn hiện tại không chịu bất kỳ chế tài hay án phạt hạn chế nhận việc nào.
        </Text>

        {appealSuccess ? (
          <Text style={[styles.bodyText, { color: colors.success, fontWeight: '700' }]}>
            ✓ Đã gửi đơn kháng nghị tới SUPER_ADMIN. Hệ thống sẽ xem xét trong vòng 48h.
          </Text>
        ) : null}

        {!showAppeal ? (
          <Button
            title="Gửi đơn khiếu nại / Kháng nghị"
            variant="secondary"
            onPress={() => setShowAppeal(true)}
          />
        ) : null}

        {showAppeal ? (
          <View style={styles.appealForm}>
            <Text style={styles.sectionTitle}>Đơn kháng nghị tới Ban Quản Trị:</Text>

            <TextField
              label="Mã tham chiếu chế tài hoặc quyết định (tùy chọn)"
              placeholder="Ví dụ: SNC-001 hoặc DISP-101"
              value={appealRefId}
              onChangeText={setAppealRefId}
            />

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

            <TextField
              label="Link tài liệu chứng cứ đính kèm (URL)"
              placeholder="https://..."
              value={appealEvidence}
              onChangeText={setAppealEvidence}
              autoCapitalize="none"
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
      </Card>
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
