import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { phaseOf } from '@/api/evidenceApi';
import type { EvidenceDto } from '@/api/types';
import { formatDateTime } from '@/lib/format';
import { Lightbox } from '@/ui/Lightbox';
import { colors, font, radius, Skeleton, spacing } from '@/ui';

import { useEvidence } from './hooks';

export function EvidenceGrid({ orderId, footer }: { orderId: string; footer?: React.ReactNode }) {
  const evidence = useEvidence(orderId, true);
  const [open, setOpen] = React.useState<EvidenceDto | null>(null);

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>Bằng chứng công việc</Text>
      {evidence.isPending ? (
        <Skeleton height={96} />
      ) : evidence.isError ? (
        <Text style={styles.muted}>{errorMessage(evidence.error)}</Text>
      ) : evidence.data.length === 0 ? (
        <Text style={styles.muted}>Chưa có ảnh bằng chứng.</Text>
      ) : (
        <View style={styles.grid}>
          {evidence.data.map((e) => (
            <Pressable
              key={e.workEvidenceId}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Bằng chứng ${phaseOf(e.phase).label}`}
              onPress={() => setOpen(e)}
              style={styles.tile}>
              <Image source={{ uri: e.fileUrl }} style={styles.img} contentFit="cover" />
              <Text style={styles.phase}>{phaseOf(e.phase).short}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {footer}
      <Lightbox
        uri={open?.fileUrl ?? null}
        caption={open ? `${phaseOf(open.phase).label} · ${formatDateTime(open.capturedAt ?? open.createdAt)}` : undefined}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '31%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border },
  img: { width: '100%', height: '100%' },
  phase: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: colors.white,
    fontSize: font.small - 1,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
});
