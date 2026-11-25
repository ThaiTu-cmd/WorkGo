import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocumentAsync, type DocumentPickerAsset } from 'expo-document-picker';
import { Directory } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Text } from 'react-native';

import { errorMessage, orderErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { qk } from '@/api/queryKeys';
import type { ExecutionDto, OrderDeliveryFile, OrderDto, OrderRole } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { useT } from '@/i18n';
import { API_BASE_URL } from '@/lib/env';
import { formatDateTime } from '@/lib/format';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Button, Card, ErrorState, Skeleton, TextField, font, makeStyles } from '@/ui';

const maxFileBytes = 50 * 1024 * 1024;
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'video/mp4'];

export function DigitalDeliveryCard({ order, role, execution }: {
  order: OrderDto;
  role: OrderRole;
  execution?: ExecutionDto['digital'];
}) {
  const t = useT();
  const styles = useStyles();
  const { token } = useAuth();
  const tokenRef = useRef(token);
  const downloadController = useRef<AbortController | null>(null);
  useEffect(() => {
    tokenRef.current = token;
    return () => {
      tokenRef.current = null;
      downloadController.current?.abort();
    };
  }, [token]);
  const queryClient = useQueryClient();
  const once = useSingleFlight();
  const [file, setFile] = useState<DocumentPickerAsset | null>(null);
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState('');
  const [reason, setReason] = useState('');
  const [criterion, setCriterion] = useState('');
  const [repairResponse, setRepairResponse] = useState('');
  const [repairDeadline, setRepairDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const uploaded = useRef<{ uri: string; id: string } | null>(null);
  const { orderId } = order;
  const queryKey = [...qk.order(orderId), 'deliveries'];
  const deliveries = useQuery({ queryKey, queryFn: async () => (await orderApi.getDeliveries(orderId)).result });
  const brief = useQuery({
    queryKey: [...qk.order(orderId), 'requirements'],
    queryFn: async () => (await orderApi.getOrder(orderId)).result.snapshot?.requirementValues ?? null,
  });
  const revisions = useQuery({
    queryKey: [...qk.order(orderId), 'revisions'],
    queryFn: async () => (await orderApi.getRevisions(orderId)).result,
  });
  const agreement = useQuery({
    queryKey: [...qk.order(orderId), 'agreement'],
    queryFn: async () => (await orderApi.getAgreement(orderId)).result.at(-1),
  });
  const refresh = () => Promise.all(
    [qk.order(orderId), qk.orderHistory(orderId), qk.orderExecution(orderId), qk.orders('CLIENT'), qk.orders('PROVIDER'), qk.escrow(orderId), qk.wallet()].map(
      (key) => queryClient.invalidateQueries({ queryKey: key })
    )
  );
  const respond = useMutation({
    networkMode: 'always',
    mutationFn: (send: () => Promise<unknown>) => send(),
    onSuccess: () => { setDescription(''); setLinks(''); setReason(''); },
    onError: (err) => setError(orderErrorMessage(err)),
    onSettled: refresh,
  });
  const runResponse = (send: () => Promise<unknown>) => {
    setError(null);
    void once(() => respond.mutateAsync(send).catch(() => undefined));
  };

  const choose = async () => {
    setError(null);
    try {
      const selection = await getDocumentAsync({ type: acceptedTypes, copyToCacheDirectory: true });
      if (selection.canceled) return;
      const item = selection.assets[0];
      if (!item) return;
      if ((item.size ?? 0) > maxFileBytes) {
        setError(t('digitalDelivery.file_too_large'));
        return;
      }
      setFile(item);
      uploaded.current = null;
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const deliver = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (!file) throw new Error(t('digitalDelivery.choose_file'));
      if (uploaded.current?.uri !== file.uri) {
        const body = new FormData();
        if (file.file) body.append('file', file.file, file.name);
        else body.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' } as unknown as Blob);
        const { result } = await orderApi.uploadFile(orderId, 'DELIVERY', body);
        uploaded.current = { uri: file.uri, id: result.storedFileId };
      }
      return orderApi.submitDelivery(orderId, { message: message.trim(), files: [{ fileId: uploaded.current.id }] });
    },
    onSuccess: () => {
      setFile(null);
      setMessage('');
      uploaded.current = null;
      void queryClient.invalidateQueries({ queryKey: qk.orders(role) });
    },
    onError: (err) => setError(orderErrorMessage(err)),
    onSettled: refresh,
  });

  const download = (asset: OrderDeliveryFile) => {
    void once(async () => {
      setError(null);
      setSaved(null);
      setDownloading(asset.deliveryFileId);
      const controller = new AbortController();
      downloadController.current = controller;
      try {
        if (!asset.storedFileId) {
          if (asset.fileUrl?.startsWith('https://')) await Linking.openURL(asset.fileUrl);
          return;
        }
        const destination = Platform.OS === 'web' ? null : await Directory.pickDirectoryAsync();
        const { result } = await orderApi.getDownloadUrl(orderId, asset.storedFileId);
        if (!result.url.startsWith('/orders/files/' + asset.storedFileId + '/content?') || !token || tokenRef.current !== token) {
          throw new Error(t('digitalDelivery.download_failed'));
        }
        const response = await fetch(API_BASE_URL + '/order' + result.url, {
          headers: { Authorization: 'Bearer ' + token }, redirect: 'error', signal: controller.signal,
        });
        if (!response.ok || tokenRef.current !== token) throw new Error(t('digitalDelivery.download_failed'));
        const name = asset.fileName?.replace(/[\\/]/g, '_').trim();
        const filename = name && name !== '.' && name !== '..' ? name : t('digitalDelivery.file');
        if (destination) {
          if (!response.body) throw new Error(t('digitalDelivery.download_failed'));
          const output = destination.createFile(filename, asset.mimeType ?? null);
          try {
            await response.body.pipeTo(output.writableStream(), { signal: controller.signal });
          } catch (err) {
            output.delete();
            throw err;
          }
        } else {
          const url = URL.createObjectURL(await response.blob());
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        setSaved(filename);
      } catch (err) {
        if ((err as { code?: string })?.code !== 'ERR_PICKER_CANCELLED') setError(errorMessage(err));
      } finally {
        downloadController.current = null;
        setDownloading(null);
      }
    });
  };

  const canDeliver = role === 'PROVIDER' && order.orderStatus === 'IN_PROGRESS' &&
    (execution?.status === 'WORKING' || execution?.status === 'REVISING');
  const canSendRequirements = false; // Input consent/submission/review is handled by OrderInputCard.
  const latest = deliveries.data?.[0];
  const canReview = role === 'CLIENT' && order.orderStatus === 'DELIVERED' &&
    execution?.status === 'SUBMITTED' && latest?.status === 'SUBMITTED';
  const revisionAvailable = true; // Unlimited in-scope repairs, including historical limit 0.
  const parsedRepairDeadline = new Date(repairDeadline);
  const validRepairDeadline = Number.isFinite(parsedRepairDeadline.getTime());
  const references = links.split(/\r?\n/).map((link) => link.trim()).filter(Boolean);
  const invalidReference = references.some((link) => !/^https?:\/\/\S+$/i.test(link));
  const storedDescription = brief.data?.description;
  const storedReferences = brief.data?.references;
  return (
    <Card>
      <Text style={styles.title}>{t('digitalDelivery.title')}</Text>
      <Text style={styles.title}>{t('digitalDelivery.requirements')}</Text>
      {brief.isPending ? <Skeleton height={32} /> : brief.error ? (
        <ErrorState message={orderErrorMessage(brief.error)} onRetry={() => void brief.refetch()} />
      ) : (
        <>
          {typeof storedDescription === 'string' ? <Text selectable style={styles.text}>{storedDescription}</Text> : null}
          {Array.isArray(storedReferences) && storedReferences.filter((link): link is string => typeof link === 'string').map(
            (link, index) => <Text key={index} selectable style={styles.text}>{link}</Text>
          )}
        </>
      )}
      {canSendRequirements && (
        <>
          <TextField label={t('digitalDelivery.description')} multiline value={description} onChangeText={setDescription} />
          <TextField label={t('digitalDelivery.references')} multiline value={links} onChangeText={setLinks} />
          {invalidReference && <Text style={styles.error}>{t('digitalDelivery.invalid_reference')}</Text>}
          <Button title={t('digitalDelivery.send_requirements')} loading={respond.isPending}
            disabled={!description.trim() || invalidReference || !!downloading}
            onPress={() => runResponse(() => orderApi.submitRequirements(orderId, { description: description.trim(), references }))} />
        </>
      )}
      {execution?.deadlineAt && <Text style={styles.text}>{t('digitalDelivery.deadline', { p0: formatDateTime(execution.deadlineAt) })}</Text>}
      {deliveries.isPending ? <Skeleton height={42} /> : deliveries.isError ? (
        <ErrorState message={orderErrorMessage(deliveries.error)} onRetry={() => void deliveries.refetch()} />
      ) : deliveries.data.length === 0 ? <Text style={styles.text}>{t('digitalDelivery.empty')}</Text> : (
        deliveries.data.map((item) => (
          <Card key={item.deliveryPackageId}>
            <Text style={styles.title}>{t('digitalDelivery.version', { p0: item.versionNo })} Â· {formatDateTime(item.deliveredAt)}</Text>
            {item.message && <Text style={styles.text}>{item.message}</Text>}
            {item.files.map((asset) => (
              asset.storedFileId || asset.fileUrl?.startsWith('https://') ? (
                <Button key={asset.deliveryFileId} variant="secondary" disabled={!!downloading || deliver.isPending}
                  title={t('digitalDelivery.download_file', { p0: asset.fileName })} loading={downloading === asset.deliveryFileId}
                  onPress={() => download(asset)} />
              ) : <Text key={asset.deliveryFileId} style={styles.text}>{asset.fileName}</Text>
            ))}
          </Card>
        ))
      )}
      {canReview && (
        <>
          <Button title={t('digitalDelivery.accept')} disabled={!!downloading} loading={respond.isPending}
            onPress={() => runResponse(() => orderApi.acceptDelivery(orderId))} />
          {revisionAvailable ? (
            <>
              <Text>Sửa lỗi trong phạm vi không giới hạn lượt. Ngoài phạm vi cần phụ lục.</Text>
              <Text>Bản bàn giao {latest?.versionNo} · Cam kết {agreement.data?.versionNo}</Text>
              {agreement.isError && <ErrorState message={orderErrorMessage(agreement.error)} onRetry={() => void agreement.refetch()} />}
              {agreement.data?.scope && <Button title={`Phạm vi: ${agreement.data.scope}`} variant={criterion === 'scope' ? 'primary' : 'secondary'} onPress={() => setCriterion('scope')} />}
              {agreement.data?.acceptanceCriteria && <Button title={`Tiêu chí: ${agreement.data.acceptanceCriteria}`} variant={criterion === 'acceptanceCriteria' ? 'primary' : 'secondary'} onPress={() => setCriterion('acceptanceCriteria')} />}
              <TextField label={t('digitalDelivery.revision_reason')} multiline value={reason} onChangeText={setReason} />
              <Button title={t('digitalDelivery.request_revision')} variant="secondary" loading={respond.isPending}
                disabled={!reason.trim() || !criterion || !agreement.data || !!downloading}
                onPress={() => runResponse(() => orderApi.requestRevision(orderId, { reason: reason.trim(), deliveryVersion: latest!.versionNo, agreementVersion: agreement.data!.versionNo, criterionRefs: [criterion], scopeChange: false }))} />
            </>
          ) : <Text style={styles.text}>{t('digitalDelivery.revision_limit_reached')}</Text>}
        </>
      )}
      {revisions.isError && <ErrorState message={orderErrorMessage(revisions.error)} onRetry={() => void revisions.refetch()} />}
      {(revisions.data ?? []).map((revision) => (
        <Card key={revision.revisionRequestId}>
          <Text style={styles.title}>Bản {revision.deliveryVersion ?? 'cũ'} · {revision.status}</Text>
          <Text>Cam kết {revision.agreementVersion ?? 'cũ'} · {revision.criterionRefs?.join(', ')}</Text>
          <Text>{revision.scopeSnapshot}</Text><Text>{revision.criteriaSnapshot}</Text>
          {revision.responseDueAt && <Text>Phản hồi trước: {formatDateTime(revision.responseDueAt)}</Text>}
          {revision.deadlineAgreementDueAt && <Text>Chốt hạn trước: {formatDateTime(revision.deadlineAgreementDueAt)}</Text>}
          {revision.adminSuggested && <Text>Đã 3 vòng hoặc 7 ngày: nên liên hệ ADMIN hỗ trợ, không giới hạn lượt sửa.</Text>}
          {revision.supportRequired && <Text>Quá hạn phản hồi/chốt hạn: cần ADMIN hỗ trợ.</Text>}
          {revision.providerResponse && <Text>Provider: {revision.providerResponse}</Text>}
          {revision.proposedRepairDeadline && <Text>Đề xuất: {formatDateTime(revision.proposedRepairDeadline)}</Text>}
          {revision.agreedRepairDeadline && <Text>Hạn đã chốt: {formatDateTime(revision.agreedRepairDeadline)}</Text>}
          {order.orderStatus === 'IN_PROGRESS' && role === 'PROVIDER' && ['OPEN', 'RESPONDED'].includes(revision.status) && <>
            <TextField label="Phản hồi sửa" multiline value={repairResponse} onChangeText={setRepairResponse} />
            <TextField label="Hạn sửa (VD: 2026-11-28T17:00:00+07:00)" value={repairDeadline} onChangeText={setRepairDeadline} />
            <Button title="Gửi phản hồi và hạn sửa" loading={respond.isPending} disabled={!repairResponse.trim() || !validRepairDeadline}
              onPress={() => runResponse(() => orderApi.respondRevision(orderId, revision.revisionRequestId,
                { response: repairResponse.trim(), proposedRepairDeadline: parsedRepairDeadline.toISOString() }))} />
          </>}
          {order.orderStatus === 'IN_PROGRESS' && role === 'CLIENT' && revision.status === 'RESPONDED' && revision.proposedRepairDeadline && <Button
            title="Đồng ý hạn sửa đề xuất" loading={respond.isPending}
            onPress={() => runResponse(() => orderApi.confirmRepairDeadline(orderId, revision.revisionRequestId, revision.proposedRepairDeadline!))} />}

          <Text selectable style={styles.text}>{revision.reason}</Text>
          <Text style={styles.text}>{formatDateTime(revision.createdAt)}</Text>
        </Card>
      ))}
      {canDeliver && (
        <>
          <TextField label={t('digitalDelivery.message')} value={message} onChangeText={setMessage} />
          <Button title={file?.name ?? t('digitalDelivery.choose_file')} variant="secondary" disabled={deliver.isPending} onPress={() => void choose()} />
          <Button title={t('digitalDelivery.submit')} disabled={!file || !!downloading} loading={deliver.isPending}
            onPress={() => { setError(null); void once(() => deliver.mutateAsync().catch(() => undefined)); }} />
        </>
      )}
      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      {saved && <Text style={styles.text} accessibilityLiveRegion="polite">{t('digitalDelivery.saved', { p0: saved })}</Text>}
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { color: colors.text, fontSize: font.body, fontWeight: '700' },
  text: { color: colors.text, fontSize: font.body },
  error: { color: colors.danger, fontSize: font.body },
}));
