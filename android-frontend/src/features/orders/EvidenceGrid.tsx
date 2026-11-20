import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { phaseOf } from '@/api/evidenceApi';
import { orderApi } from '@/api/orderApi';
import type { EvidenceDto } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { API_BASE_URL } from '@/lib/env';
import { formatDateTime } from '@/lib/format';
import { Lightbox } from '@/ui/Lightbox';
import { font, makeStyles, radius, Skeleton, spacing } from '@/ui';

import { useEvidence } from './hooks';
import { useT } from '@/i18n';

export function EvidenceGrid({ orderId, footer }: { orderId: string; footer?: React.ReactNode }) {
  const t = useT();
  const styles = useStyles();
  const evidence = useEvidence(orderId, true);
  const [open, setOpen] = React.useState<EvidenceDto | null>(null);
  const { token } = useAuth();
  const fileId = open?.storedFileId;
  const download = useQuery({
    queryKey: ['evidence-download', orderId, fileId],
    enabled: !!fileId && !!token,
    gcTime: 0,
    queryFn: async () => (await orderApi.getDownloadUrl(orderId, fileId!)).result.url,
  });
  const url = fileId && download.data?.startsWith('/orders/files/') ? `${API_BASE_URL}/order${download.data}` : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>{t('evidenceGrid.bang_chung_cong_viec')}</Text>
      {evidence.isPending ? (
        <Skeleton height={96} />
      ) : evidence.isError ? (
        <Text style={styles.muted}>{errorMessage(evidence.error)}</Text>
      ) : evidence.data.length === 0 ? (
        <Text style={styles.muted}>{t('evidenceGrid.chua_co_anh_bang_chung')}</Text>
      ) : (
        <View style={styles.grid}>
          {evidence.data.map((e) => (
            <Pressable
              key={e.workEvidenceId}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('evidenceGrid.bang_chung', { p0: phaseOf(e.phase).label })}
              onPress={() => setOpen(e)}
              style={styles.tile}>
              {e.fileUrl ? <Image source={{ uri: e.fileUrl }} style={styles.img} contentFit="cover" /> : null}
              <Text style={styles.phase}>{phaseOf(e.phase).short}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {fileId && download.isFetching ? <Skeleton height={32} /> : null}
      {fileId && download.error ? <Text style={styles.muted} accessibilityLiveRegion="polite">{errorMessage(download.error)}</Text> : null}
      {footer}
      <Lightbox
        uri={fileId ? url : open?.fileUrl ?? null}
        headers={url && token ? { Authorization: `Bearer ${token}` } : undefined}
        caption={open ? `${phaseOf(open.phase).label} · ${formatDateTime(open.capturedAt ?? open.createdAt)}` : undefined}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
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
}));
