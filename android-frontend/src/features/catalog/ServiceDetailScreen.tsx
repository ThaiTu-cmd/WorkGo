import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { formatVnd } from '@/lib/format';
import { Avatar, Badge, Button, Card, colors, ErrorState, font, Screen, SkeletonList, spacing } from '@/ui';

import { useServiceDetail } from './hooks';
import { PackagePicker } from './PackagePicker';
import { EXECUTION_LABEL } from './ServiceCardView';

const WIDTH = Dimensions.get('window').width;

export function ServiceDetailScreen() {
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
    else router.push({ pathname: '/auth/login', params: { redirect: `/checkout?serviceId=${service.serviceId}` } });
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
        <Text style={styles.price}>Từ {formatVnd(service.basePrice)}</Text>
        {service.avgRating !== null ? (
          <Text style={styles.muted}>
            ★ {service.avgRating.toFixed(1)} ({service.reviewCount} đánh giá) · {service.orderCount} đơn
          </Text>
        ) : null}

        <Card>
          <View style={styles.row}>
            <Avatar name={service.provider.name} />
            <View style={styles.flex}>
              <Text style={styles.providerName}>{service.provider.name}</Text>
              {service.provider.isVerified ? <Text style={styles.verified}>Đã xác minh</Text> : null}
            </View>
          </View>
          {service.provider.bio ? <Text style={styles.text}>{service.provider.bio}</Text> : null}
        </Card>

        {service.description ? (
          <>
            <Text style={styles.section}>Mô tả</Text>
            <Text style={styles.text}>{service.description}</Text>
          </>
        ) : null}

        <Text style={styles.section}>Gói dịch vụ</Text>
        {service.packages.length ? (
          <PackagePicker packages={service.packages} selectedId={selected} onSelect={setPackageId} />
        ) : (
          <Text style={styles.muted}>Dịch vụ chưa có gói để đặt.</Text>
        )}

        {service.addons.length ? (
          <>
            <Text style={styles.section}>Tuỳ chọn thêm</Text>
            {service.addons.map((a) => (
              <View key={a.id} style={styles.addon}>
                <Text style={styles.text}>{a.name}</Text>
                <Text style={styles.muted}>+{formatVnd(a.price)}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Button title="Đặt dịch vụ" onPress={order} disabled={!service.packages.length} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
