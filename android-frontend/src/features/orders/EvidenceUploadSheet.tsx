import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { errorMessage, evidenceErrorMessage } from '@/api/errors';
import { EVIDENCE_PHASES, evidenceApi } from '@/api/evidenceApi';
import { qk } from '@/api/queryKeys';
import type { EvidencePhase } from '@/api/types';
import { pickImage, type PickedImage } from '@/lib/image';
import { Button, Chip, colors, font, radius, spacing } from '@/ui';

import { buildEvidenceBody, getLocationOrNull } from './evidence';

export function EvidenceUploadButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button title="Thêm bằng chứng" onPress={() => setOpen(true)} />
      {open ? <EvidenceUploadSheet orderId={orderId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function EvidenceUploadSheet({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = React.useState<EvidencePhase>('BEFORE');
  const [image, setImage] = React.useState<PickedImage | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!image) throw new Error('Vui lòng chụp hoặc chọn một ảnh.');
      const location = await getLocationOrNull();
      return evidenceApi.createEvidence(orderId, buildEvidenceBody(phase, image, location));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.evidence(orderId) });
      onClose();
    },
    onError: (err) => setError(evidenceErrorMessage(err)),
  });

  const choose = async (source: 'camera' | 'library') => {
    setError(null);
    try {
      const picked = await pickImage(source);
      if (picked) setImage(picked);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Gửi bằng chứng công việc</Text>
          <Text style={styles.label}>Giai đoạn</Text>
          <View style={styles.row}>
            {EVIDENCE_PHASES.map((p) => (
              <Chip key={p.value} label={p.label} selected={phase === p.value} onPress={() => setPhase(p.value)} />
            ))}
          </View>
          {image ? <Image source={{ uri: image.dataUrl }} style={styles.preview} contentFit="cover" /> : null}
          <View style={styles.row}>
            <Button title="Chụp ảnh" variant="secondary" style={styles.flex} onPress={() => void choose('camera')} />
            <Button title="Chọn ảnh" variant="secondary" style={styles.flex} onPress={() => void choose('library')} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Gửi" loading={upload.isPending} disabled={!image} onPress={() => upload.mutate()} />
          <Button title="Đóng" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1 },
  preview: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.border },
  error: { fontSize: font.body, color: colors.danger },
});
