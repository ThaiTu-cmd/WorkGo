import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Text, View } from 'react-native';

import { qk } from '@/api/queryKeys';
import { trustApi } from '@/api/trustApi';
import type { DisputeDto } from '@/api/types';
import { Badge, Button, Card, font, makeStyles, Screen, spacing, useColors } from '@/ui';

type Props = {
  disputeId: string;
  initialDispute?: DisputeDto;
  onBack?: () => void;
};

export function DisputeDetailScreen({ disputeId, initialDispute, onBack }: Props) {
  const styles = useStyles();
  const colors = useColors();
  const queryClient = useQueryClient();

  const [evidenceFile,setEvidenceFile]=React.useState<{uri:string;name:string;type:string}|null>(null);
  const progressQuery=useQuery({queryKey:['decisionProgress',disputeId],queryFn:async()=>(await trustApi.getDecisionProgress(disputeId)).result,retry:false});
  const [showSupplementForm, setShowSupplementForm] = React.useState(false);
  const [supplementError, setSupplementError] = React.useState<string | null>(null);

  const disputeQuery = useQuery({
    queryKey: qk.dispute(disputeId),
    initialData: initialDispute ? { result: initialDispute } : undefined,
    queryFn: async () => (await trustApi.getDispute(disputeId)) ?? null,
  });

  const dispute = disputeQuery.data?.result ?? initialDispute;

  const cancelMutation = useMutation({
    mutationFn: () => trustApi.cancelDispute(disputeId, { reason: 'Người dùng rút đơn khiếu nại' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.dispute(disputeId) });
      void queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });

  const supplementMutation = useMutation({
    mutationFn: async () => {
      return (
        await trustApi.supplementEvidence(disputeId, evidenceFile ?? (()=>{throw new Error('Select an evidence file');})())
      ).result;
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: qk.dispute(disputeId) });
      setShowSupplementForm(false);
      setEvidenceFile(null);
      setSupplementError(null);
    },
    onError: (err: Error) => {
      setSupplementError(err.message || 'Không gửi được chứng cứ bổ sung.');
    },
  });

  const handleSupplementSubmit = () => {
    if (!evidenceFile) {
      setSupplementError('Vui lòng chọn file chứng cứ bổ sung.');
      return;
    }
    setSupplementError(null);
    supplementMutation.mutate();
  };

  if (!dispute) {
    return (
      <Screen>
        <Text style={styles.muted}>Đang tải chi tiết khiếu nại...</Text>
      </Screen>
    );
  }

  const isResolved =
    dispute.status === 'RESOLVED' ||
    dispute.status === 'RESOLVED_CLIENT' ||
    dispute.status === 'RESOLVED_PROVIDER';

  const settlementStatus=progressQuery.data?.paymentStatus??'RECONCILIATION_PENDING';

  return (
    <Screen refreshing={disputeQuery.isRefetching} onRefresh={() => void disputeQuery.refetch()}>
      {onBack ? (
        <Button title="← Quay lại danh sách" variant="secondary" onPress={onBack} />
      ) : null}

      <Card style={styles.mainCard}>
        <View style={styles.row}>
          <Text style={styles.title}>{dispute.disputeId}</Text>
          <Badge
            label={
              dispute.status === 'OPEN'
                ? 'Đang mở'
                : dispute.status === 'UNDER_REVIEW'
                ? 'Đang thẩm định'
                : isResolved
                ? 'Đã giải quyết'
                : 'Đã đóng'
            }
            tone={
              dispute.status === 'OPEN'
                ? 'warning'
                : dispute.status === 'UNDER_REVIEW'
                ? 'info'
                : isResolved
                ? 'success'
                : 'neutral'
            }
          />
        </View>

        <Text style={styles.label}>Đơn hàng liên quan: {dispute.orderId}</Text>
        <Text style={styles.metaText}>
          Bên khiếu nại: {dispute.openedByRole || 'Thành viên'} • Ngày tạo: {dispute.createdAt?.slice(0, 10)}
        </Text>

        <Text style={styles.sectionHeader}>Lý do khiếu nại:</Text>
        <Text style={styles.reasonText}>{dispute.reason}</Text>

        {dispute.description ? (
          <>
            <Text style={styles.sectionHeader}>Mô tả chi tiết:</Text>
            <Text style={styles.bodyText}>{dispute.description}</Text>
          </>
        ) : null}

        {dispute.evidenceUrl ? (
          <>
            <Text style={styles.sectionHeader}>Minh chứng ban đầu:</Text>
            <Text style={styles.linkText}>{dispute.evidenceUrl}</Text>
          </>
        ) : null}
      </Card>

      {/* 4-Step Timeline */}
      <Card style={styles.timelineCard}>
        <Text style={styles.cardTitle}>Tiến trình hòa giải & Xử lý</Text>

        <View style={styles.timeline}>
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, styles.stepDotDone]} />
            <Text style={styles.stepTitle}>1. Mở hồ sơ & Đóng băng Escrow</Text>
            <Text style={styles.stepDesc}>
              Trạng thái phong tỏa và thanh toán được xác nhận riêng theo tiến độ từ server.
            </Text>
          </View>

          <View style={styles.timelineStep}>
            <View
              style={[
                styles.stepDot,
                dispute.status !== 'OPEN' ? styles.stepDotDone : styles.stepDotActive,
              ]}
            />
            <Text style={styles.stepTitle}>2. Ban quản trị thẩm định</Text>
            <Text style={styles.stepDesc}>
              Trọng tài viên kiểm tra hợp đồng, sản phẩm bàn giao và thỏa thuận.
            </Text>
          </View>

          <View style={styles.timelineStep}>
            <View
              style={[
                styles.stepDot,
                dispute.supplementaryEvidences && dispute.supplementaryEvidences.length > 0
                  ? styles.stepDotDone
                  : dispute.status === 'UNDER_REVIEW'
                  ? styles.stepDotActive
                  : null,
              ]}
            />
            <Text style={styles.stepTitle}>3. Bổ sung chứng cứ đối chất</Text>
            <Text style={styles.stepDesc}>
              Hai bên cung cấp thêm bằng chứng đối soát theo yêu cầu.
            </Text>
          </View>

          <View style={styles.timelineStep}>
            <View
              style={[
                styles.stepDot,
                isResolved ? styles.stepDotDone : null,
              ]}
            />
            <Text style={styles.stepTitle}>4. Phán quyết & Giải ngân</Text>
            <Text style={styles.stepDesc}>
              Kết luận, thanh toán và trạng thái Order có tiến độ xử lý riêng.
            </Text>
          </View>
        </View>
      </Card>

      {/* 3-Way Admin Decision & Financial Settlement */}
      <Card style={styles.decisionCard}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Kết luận giải quyết</Text>
          <Badge
            label={`Tài chính: ${settlementStatus}`}
            tone={
              settlementStatus === 'SETTLED'
                ? 'success'
                : settlementStatus === 'REFUNDED'
                ? 'info'
                : settlementStatus === 'SPLIT_COMPLETED'
                ? 'warning'
                : 'danger'
            }
          />
        </View>

        <View style={styles.decisionGrid}>
          <View
            style={[
              styles.decisionBox,
              dispute.decision?.type === 'RELEASE' || dispute.status === 'RESOLVED_PROVIDER'
                ? styles.decisionBoxSelected
                : null,
            ]}>
            <Text style={[styles.decisionTitle, { color: colors.success }]}>1. RELEASE</Text>
            <Text style={styles.decisionDesc}>
              Thực hiện nghĩa vụ thanh toán theo kết luận và phương thức thanh toán của Order.
            </Text>
          </View>

          <View
            style={[
              styles.decisionBox,
              dispute.decision?.type === 'REFUND' || dispute.status === 'RESOLVED_CLIENT'
                ? styles.decisionBoxSelected
                : null,
            ]}>
            <Text style={[styles.decisionTitle, { color: colors.primary }]}>2. REFUND</Text>
            <Text style={styles.decisionDesc}>
              Hoàn trả theo kết luận. Tiền mặt chỉ hoàn tất khi bên nhận xác nhận đã nhận lại tiền.
            </Text>
          </View>

          <View
            style={[
              styles.decisionBox,
              dispute.decision?.type === 'REJECT' ? styles.decisionBoxSelected : null,
            ]}>
            <Text style={[styles.decisionTitle, { color: colors.warning }]}>3. REJECT</Text>
            <Text style={styles.decisionDesc}>
              Bác yêu cầu; tiến độ gỡ phong tỏa và tiếp tục Order được xác nhận riêng.
            </Text>
          </View>
        </View>

        {dispute.decision?.type === 'SPLIT' ? <Text style={styles.muted}>Kết luận SPLIT lịch sử; xem tiến độ thực thi đã ghi nhận.</Text> : null}

        {dispute.resolution || dispute.decision?.reason ? (
          <View style={styles.resolutionBox}>
            <Text style={styles.resolutionTitle}>Kết luận của Ban Quản Trị:</Text>
            <Text style={styles.resolutionText}>
              {dispute.decision?.reason ?? dispute.resolution}
            </Text>
          </View>
        ) : (
          <Text style={styles.muted}>
            Hồ sơ đang trong thời hạn xem xét. Kết luận và lệnh chuyển tiền sẽ cập nhật tại đây.
          </Text>
        )}
      </Card>

      {/* Supplementary Evidences List */}
      {dispute.supplementaryEvidences && dispute.supplementaryEvidences.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>Chứng cứ bổ sung đã gửi:</Text>
          {dispute.supplementaryEvidences.map((ev, idx) => (
            <View key={idx} style={styles.supplementItem}>
              <Text style={styles.metaText}>Thời gian: {ev.submittedAt}</Text>
              {ev.note ? <Text style={styles.bodyText}>Ghi chú: {ev.note}</Text> : null}
              {ev.evidenceUrl ? <Text style={styles.linkText}>URL: {ev.evidenceUrl}</Text> : null}
            </View>
          ))}
        </Card>
      ) : null}

      {/* Supplement Evidence Form */}
      {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && !showSupplementForm ? (
        <Button
          title="+ Bổ sung chứng cứ đối chất"
          variant="secondary"
          onPress={() => setShowSupplementForm(true)}
        />
      ) : null}


      {showSupplementForm ? (
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Bổ sung chứng cứ theo yêu cầu Admin</Text>

      <Button title={evidenceFile?.name??'Chọn file chứng cứ'} onPress={async()=>{const result=await DocumentPicker.getDocumentAsync({copyToCacheDirectory:true,multiple:false});if(!result.canceled){const f=result.assets[0];setEvidenceFile({uri:f.uri,name:f.name,type:f.mimeType??'application/octet-stream'});}}}/>

          {supplementError ? <Text style={styles.errorText}>{supplementError}</Text> : null}

          <View style={styles.row}>
            <Button
              title="Gửi bổ sung"
              loading={supplementMutation.isPending}
              onPress={handleSupplementSubmit}
            />
            <Button
              title="Hủy"
              variant="secondary"
              onPress={() => setShowSupplementForm(false)}
            />
          </View>
        </Card>
      ) : null}

      {/* Cancel Action */}
      {dispute.status === 'OPEN' ? (
        <Button
          title="Rút đơn khiếu nại này"
          variant="danger"
          loading={cancelMutation.isPending}
          onPress={() => cancelMutation.mutate()}
        />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  mainCard: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  cardTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  sectionHeader: { fontSize: font.small, fontWeight: '700', color: colors.muted, marginTop: spacing.xs },
  label: { fontSize: font.body, fontWeight: '600', color: colors.text },
  metaText: { fontSize: font.small - 1, color: colors.muted },
  reasonText: { fontSize: font.body, fontWeight: '600', color: colors.text },
  bodyText: { fontSize: font.body, color: colors.text },
  linkText: { fontSize: font.small, color: colors.primary, textDecorationLine: 'underline' },
  timelineCard: { gap: spacing.md },
  timeline: { gap: spacing.md, paddingLeft: spacing.md, borderLeftWidth: 2, borderColor: colors.border },
  timelineStep: { gap: 2 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, position: 'absolute', left: -spacing.md - 6, top: 4 },
  stepDotDone: { backgroundColor: colors.success },
  stepDotActive: { backgroundColor: colors.primary },
  stepTitle: { fontSize: font.small, fontWeight: '700', color: colors.text },
  stepDesc: { fontSize: font.small - 1, color: colors.muted },
  decisionCard: { gap: spacing.md },
  decisionGrid: { gap: spacing.sm },
  decisionBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, gap: 2, backgroundColor: colors.bg },
  decisionBoxSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  decisionTitle: { fontSize: font.small, fontWeight: '700' },
  decisionDesc: { fontSize: font.small - 1, color: colors.muted },
  resolutionBox: { padding: spacing.sm, borderRadius: 8, backgroundColor: colors.bg, gap: spacing.xs },
  resolutionTitle: { fontSize: font.small, fontWeight: '700', color: colors.text },
  resolutionText: { fontSize: font.body, color: colors.text },
  supplementItem: { paddingVertical: spacing.xs, borderBottomWidth: 1, borderColor: colors.border },
  formCard: { gap: spacing.sm },
  errorText: { fontSize: font.small, color: colors.danger },
  muted: { fontSize: font.small, color: colors.muted },
}));
