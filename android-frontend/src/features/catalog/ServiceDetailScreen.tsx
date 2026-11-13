import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { buildRedirect } from '@/auth/useRequireAuth';
import { formatVnd } from '@/lib/format';
import { Avatar, Badge, Button, Card, ErrorState, font, makeStyles, Screen, SkeletonList, spacing } from '@/ui';

import { useServiceDetail } from './hooks';
import { PackagePicker } from './PackagePicker';
import { EXECUTION_LABEL } from './ServiceCardView';
import { useT } from '@/i18n';

const WIDTH = Dimensions.get('window').width;

export function ServiceDetailScreen() {
  const t = useT();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status } = useAuth();
  const detail = useServiceDetail(id);
  const [packageId, setPackageId] = React.useState<string | null>(null);
  const service = detail.data;
  const selected = packageId ?? service?.packages[0]?.id ?? null;

  if (detail.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={3} height={140} />
      </Screen>
    );
  }
  if (detail.isError || !service) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState message={errorMessage(detail.error)} onRetry={() => void detail.refetch()} />
      </Screen>
    );
  }

  const order = () => {
    const target = { pathname: '/checkout' as const, params: { serviceId: service.serviceId, ...(selected ? { packageId: selected } : {}) } };
    if (status === 'signedIn') router.push(target);
    else
      router.push({
        pathname: '/auth/login',
        params: { redirect: buildRedirect('/checkout', { serviceId: service.serviceId, packageId: selected ?? undefined }) },
      });
  };

  return (
    <Screen edges={['bottom']} contentStyle={styles.content}>
      {service.mediaList.length ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {service.mediaList.map((m) => (
            <Image key={m.id} source={{ uri: m.url }} style={styles.image} contentFit="cover" accessibilityLabel={service.title} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.body}>
        <View style={styles.row}>
          <Badge label={EXECUTION_LABEL[service.executionType]} tone={service.executionType === 'ONSITE' ? 'info' : 'success'} />
          <Text style={styles.muted}>{service.categoryName}</Text>
        </View>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.price}>{t('serviceDetailScreen.tu', { p0: formatVnd(service.basePrice) })}</Text>
        {service.avgRating !== null ? (
          <Text style={styles.muted}>{t('serviceDetailScreen.danh_gia_don', { p0: service.avgRating.toFixed(1), p1: service.reviewCount, p2: service.orderCount })}</Text>
        ) : null}

        <Card>
          <View style={styles.row}>
            <Avatar name={service.provider.name} />
            <View style={styles.flex}>
              <Text style={styles.providerName}>{service.provider.name}</Text>
              {service.provider.isVerified ? <Text style={styles.verified}>{t('serviceDetailScreen.da_xac_minh')}</Text> : null}
            </View>
          </View>
          {service.provider.bio ? <Text style={styles.text}>{service.provider.bio}</Text> : null}
        </Card>

        {service.description ? (
          <>
            <Text style={styles.section}>{t('serviceDetailScreen.mo_ta')}</Text>
            <Text style={styles.text}>{service.description}</Text>
          </>
        ) : null}

        <Text style={styles.section}>{t('serviceDetailScreen.goi_dich_vu')}</Text>
        {service.packages.length ? (
          <PackagePicker packages={service.packages} selectedId={selected} onSelect={setPackageId} />
        ) : (
          <Text style={styles.muted}>{t('serviceDetailScreen.dich_vu_chua_co_goi')}</Text>
        )}

        {service.addons.length ? (
          <>
            <Text style={styles.section}>{t('serviceDetailScreen.tuy_chon_them')}</Text>
            {service.addons.map((a) => (
              <View key={a.id} style={styles.addon}>
                <Text style={styles.text}>{a.name}</Text>
                <Text style={styles.muted}>+{formatVnd(a.price)}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Button title={t('serviceDetailScreen.dat_dich_vu')} onPress={order} disabled={!service.packages.length} />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 0, gap: 0 },
  image: { width: WIDTH, height: WIDTH * 0.6, backgroundColor: colors.border },
  body: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  price: { fontSize: font.title, fontWeight: '700', color: colors.primaryDark },
  muted: { fontSize: font.small + 1, color: colors.muted },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  text: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  providerName: { fontSize: font.body, fontWeight: '700', color: colors.text },
  verified: { fontSize: font.small, color: colors.primaryDark },
  addon: { flexDirection: 'row', justifyContent: 'space-between' },
}));
