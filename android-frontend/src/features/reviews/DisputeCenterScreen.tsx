import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { Text, View } from 'react-native';

import { qk } from '@/api/queryKeys';
import { trustApi } from '@/api/trustApi';
import type { DisputeCreateReq, DisputeDto, DisputeKind, DisputeStatus, ReportReq, ReportTargetType } from '@/api/types';
import { Badge, Button, Card, Chip, font, makeStyles, Screen, spacing, TextField } from '@/ui';

type Props = {
  onSelectDispute?: (dispute: DisputeDto) => void;
  onOpenReputation?: () => void;
};

export function DisputeCenterScreen({ onSelectDispute, onOpenReputation }: Props) {
  const styles = useStyles();
  const queryClient = useQueryClient();

  const [filter, setFilter] = React.useState<'ALL' | DisputeStatus>('ALL');
  const [showForm, setShowForm] = React.useState(false);
  const [kind, setKind] = React.useState<DisputeKind>('DISPUTE');
  const [orderId, setOrderId] = React.useState('');
  const [targetType, setTargetType] = React.useState<ReportTargetType>('USER');
  const [targetId, setTargetId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [evidenceUrl, setEvidenceUrl] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  const disputesQuery = useQuery({
    queryKey: qk.disputes(filter),
    queryFn: async () => {
      const res = await trustApi.getMyDisputes(filter);
      return res?.result?.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (kind === 'DISPUTE') {
        const body: DisputeCreateReq = {
          orderId: orderId.trim(),
          reason: reason.trim(),
          description: description.trim() || undefined,
          evidenceUrl: evidenceUrl.trim() || undefined,
        };
        return (await trustApi.createDispute(body)).result;
      } else {
        const body: ReportReq = {
          targetType,
          targetId: targetId.trim(),
          reason: reason.trim(),
          description: description.trim() || undefined,
          evidenceUrl: evidenceUrl.trim() || undefined,
        };
        return (await trustApi.submitReport(body)).result;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setShowForm(false);
      setOrderId('');
      setTargetId('');
      setReason('');
      setDescription('');
      setEvidenceUrl('');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Không gửi được yêu cầu. Vui lòng thử lại.');
    },
  });

  const handleSubmit = () => {
    if (kind === 'DISPUTE' && orderId.trim().length < 2) {
      setFormError('Vui lòng nhập mã đơn hàng!');
      return;
    }
    if (kind === 'REPORT' && targetId.trim().length < 2) {
      setFormError('Vui lòng nhập mã đối tượng bị báo cáo!');
      return;
    }
    if (reason.trim().length < 20) {
      setFormError('Vui lòng nhập lý do chi tiết từ 20 ký tự trở lên!');
      return;
    }
    if (evidenceUrl.trim() && !evidenceUrl.trim().startsWith('http://') && !evidenceUrl.trim().startsWith('https://')) {
      setFormError('Link minh chứng chưa đúng định dạng URL!');
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  const disputesList = disputesQuery.data ?? [];

  return (
    <Screen refreshing={disputesQuery.isRefetching} onRefresh={() => void disputesQuery.refetch()}>
      <View style={styles.header}>
        <Text style={styles.title}>Trung tâm khiếu nại & Báo cáo</Text>
        <Text style={styles.subtitle}>
          Hỗ trợ hòa giải tranh chấp đơn hàng và tiếp nhận báo cáo vi phạm tiêu chuẩn cộng đồng.
        </Text>
      </View>

      <View style={styles.topActions}>
        {onOpenReputation ? (
          <Button
            title="Điểm uy tín Provider"
            variant="secondary"
            onPress={onOpenReputation}
          />
        ) : null}
        <Button
          title={showForm ? 'Đóng biểu mẫu' : '+ Mở khiếu nại / Báo cáo'}
          onPress={() => setShowForm((prev) => !prev)}
        />
      </View>

      {showForm ? (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>
            {kind === 'DISPUTE' ? 'Tạo phiếu khiếu nại đơn hàng' : 'Gửi báo cáo vi phạm'}
          </Text>

          <View style={styles.kindSelector}>
            <Chip
              label="Tranh chấp đơn"
              selected={kind === 'DISPUTE'}
              onPress={() => setKind('DISPUTE')}
            />
            <Chip
              label="Báo cáo vi phạm"
              selected={kind === 'REPORT'}
              onPress={() => setKind('REPORT')}
            />
          </View>

          {kind === 'DISPUTE' ? (
            <TextField
              label="Mã đơn hàng"
              placeholder="ORD-1042"
              value={orderId}
              onChangeText={setOrderId}
            />
          ) : (
            <>
              <Text style={styles.label}>Loại đối tượng</Text>
              <View style={styles.kindSelector}>
                {(['USER', 'JOB', 'SERVICE', 'ORDER'] as const).map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={targetType === t}
                    onPress={() => setTargetType(t)}
                  />
                ))}
              </View>
              <TextField
                label="Mã đối tượng vi phạm"
                placeholder="ID đối tượng"
                value={targetId}
                onChangeText={setTargetId}
              />
            </>
          )}

          <TextField
            label="Lý do tóm tắt (tối thiểu 20 ký tự)"
            placeholder="Lý do chi tiết sự việc..."
            value={reason}
            onChangeText={setReason}
          />

          <TextField
            label="Mô tả chi tiết"
            placeholder="Cung cấp thêm thông tin hỗ trợ đối soát..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TextField
            label="Link minh chứng đính kèm (URL)"
            placeholder="https://..."
            value={evidenceUrl}
            onChangeText={setEvidenceUrl}
            autoCapitalize="none"
          />

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Button
            title="Gửi phiếu yêu cầu"
            loading={createMutation.isPending}
            onPress={handleSubmit}
          />
        </Card>
      ) : null}

      <View style={styles.filtersRow}>
        {(['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CANCELLED'] as const).map((s) => (
          <Chip
            key={s}
            label={
              s === 'ALL'
                ? 'Tất cả'
                : s === 'OPEN'
                ? 'Đang mở'
                : s === 'UNDER_REVIEW'
                ? 'Thẩm định'
                : s === 'RESOLVED'
                ? 'Đã xử lý'
                : 'Đã hủy'
            }
            selected={filter === s}
            onPress={() => setFilter(s)}
          />
        ))}
      </View>

      <View style={styles.list}>
        {disputesQuery.isLoading ? (
          <Text style={styles.muted}>Đang tải danh sách khiếu nại...</Text>
        ) : disputesList.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Chưa có phiếu khiếu nại nào ở trạng thái này.</Text>
          </Card>
        ) : (
          disputesList.map((d) => (
            <Card
              key={d.disputeId}
              onPress={() => onSelectDispute?.(d)}
              accessibilityLabel={`Khiếu nại ${d.disputeId}`}>
              <View style={styles.cardHeader}>
                <Text style={styles.ticketId}>{d.disputeId}</Text>
                <Badge
                  label={
                    d.status === 'OPEN'
                      ? 'Đang mở'
                      : d.status === 'UNDER_REVIEW'
                      ? 'Đang thẩm định'
                      : d.status.startsWith('RESOLVED')
                      ? 'Đã giải quyết'
                      : 'Đã đóng'
                  }
                  tone={
                    d.status === 'OPEN'
                      ? 'warning'
                      : d.status === 'UNDER_REVIEW'
                      ? 'info'
                      : d.status.startsWith('RESOLVED')
                      ? 'success'
                      : 'neutral'
                  }
                />
              </View>

              <Text style={styles.orderText}>Đơn hàng: {d.orderId}</Text>
              <Text style={styles.reasonText} numberOfLines={2}>
                {d.reason}
              </Text>
              <Text style={styles.dateText}>Ngày tạo: {d.createdAt?.slice(0, 10)}</Text>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  header: { gap: spacing.xs },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: font.small, color: colors.muted },
  topActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  formCard: { gap: spacing.md, backgroundColor: colors.card },
  formTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  kindSelector: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  filtersRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  list: { gap: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketId: { fontSize: font.body, fontWeight: '700', color: colors.text },
  orderText: { fontSize: font.small, color: colors.muted },
  reasonText: { fontSize: font.body, color: colors.text },
  dateText: { fontSize: font.small - 1, color: colors.muted },
  emptyText: { fontSize: font.body, color: colors.muted, textAlign: 'center' },
  errorText: { fontSize: font.small, color: colors.danger },
  muted: { fontSize: font.small, color: colors.muted },
}));
