import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { addressApi } from '@/api/addressApi';
import { pageItems, toAddress } from '@/api/adapters';
import { availabilityApi } from '@/api/availabilityApi';
import { errorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { qk } from '@/api/queryKeys';
import type { AddressDto, BookingSlotDto, OrderCreationRequest } from '@/api/types';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { useServiceDetail } from '@/features/catalog/hooks';
import { PackagePicker } from '@/features/catalog/PackagePicker';
import { upcomingAvailableSlots } from '@/features/orders/orderStatus';
import { formatDateTime, formatVnd } from '@/lib/format';
import { Button, Card, colors, ErrorState, font, OptionRow, Screen, SkeletonList, spacing } from '@/ui';

import { estimateTotal, validateCheckout } from './checkout';

export function CheckoutScreen() {
  const signedIn = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ serviceId: string; packageId?: string }>();
  const detail = useServiceDetail(params.serviceId);
  const service = detail.data;
  const onsite = service?.executionType === 'ONSITE';

  const [packageId, setPackageId] = React.useState<string | null>(params.packageId ?? null);
  const [addonIds, setAddonIds] = React.useState<string[]>([]);
  const [slotId, setSlotId] = React.useState<string | null>(null);
  const [addressId, setAddressId] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const slots = useQuery({
    queryKey: qk.slots(params.serviceId),
    enabled: signedIn && onsite,
    queryFn: async () => upcomingAvailableSlots(pageItems<BookingSlotDto>(await availabilityApi.getSlots(params.serviceId)), Date.now()),
  });
  const addresses = useQuery({
    queryKey: qk.addresses(),
    enabled: signedIn && onsite,
    queryFn: async () => pageItems<AddressDto>(await addressApi.getMy()).map(toAddress),
  });

  const create = useMutation({
    mutationFn: (body: OrderCreationRequest) => orderApi.createOrder(body),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: qk.orders('CLIENT') });
      void queryClient.invalidateQueries({ queryKey: qk.slots(params.serviceId) });
      router.replace({ pathname: '/orders/[id]', params: { id: res.result.orderId, role: 'CLIENT' } });
    },
    onError: (err) => setSubmitError(errorMessage(err)),
  });

  if (!signedIn) return null;
  if (detail.isPending || (onsite && (slots.isPending || addresses.isPending))) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={3} height={100} />
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

  const selectedPackage = service.packages.find((p) => p.id === packageId) ?? null;
  const addressList = addresses.data ?? [];
  const slotList = slots.data ?? [];
  const check = validateCheckout({
    service: { serviceId: service.serviceId, executionType: service.executionType },
    packageId: selectedPackage?.id ?? null,
    addonIds,
    slotId,
    address: addressList.find((a) => a.id === addressId) ?? null,
    availableSlotCount: slotList.length,
    addressCount: addressList.length,
  });
  const toggleAddon = (id: string) =>
    setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Screen edges={['bottom']}>
      <Text style={styles.title}>{service.title}</Text>

      <Text style={styles.section}>Chọn gói</Text>
      <PackagePicker packages={service.packages} selectedId={packageId} onSelect={setPackageId} />

      {service.addons.length ? (
        <>
          <Text style={styles.section}>Tuỳ chọn thêm</Text>
          {service.addons.map((a) => (
            <OptionRow
              key={a.id}
              kind="checkbox"
              label={a.name}
              trailing={`+${formatVnd(a.price)}`}
              selected={addonIds.includes(a.id)}
              onPress={() => toggleAddon(a.id)}
            />
          ))}
        </>
      ) : null}

      {onsite ? (
        <>
          <Text style={styles.section}>Thời gian</Text>
          {slotList.map((s) => (
            <OptionRow
              key={s.bookingSlotId}
              kind="radio"
              label={formatDateTime(s.startedAt)}
              detail={`đến ${formatDateTime(s.endAt).slice(11)}`}
              selected={slotId === s.bookingSlotId}
              onPress={() => setSlotId(s.bookingSlotId)}
            />
          ))}

          <Text style={styles.section}>Địa chỉ</Text>
          {addressList.map((a) => (
            <OptionRow
              key={a.id}
              kind="radio"
              label={a.label || a.receiver}
              detail={a.detail}
              selected={addressId === a.id}
              onPress={() => setAddressId(a.id)}
            />
          ))}
          <Button title="Thêm địa chỉ" variant="secondary" onPress={() => router.push('/account/addresses/new')} />
        </>
      ) : null}

      <Card>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tạm tính</Text>
          <Text testID="checkout-total" style={styles.total}>
            {formatVnd(estimateTotal(selectedPackage, service.addons, addonIds))}
          </Text>
        </View>
        <Text style={styles.note}>Giá cuối cùng do hệ thống tính khi tạo đơn. Đơn mới sẽ ở trạng thái chờ thanh toán.</Text>
      </Card>

      {!check.ok ? <Text style={styles.error}>{check.error}</Text> : null}
      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
      <Button
        title="Đặt dịch vụ"
        loading={create.isPending}
        disabled={!check.ok}
        onPress={() => {
          if (!check.ok) return;
          setSubmitError(null);
          create.mutate(check.body);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  section: { fontSize: font.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: font.body, color: colors.muted },
  total: { fontSize: font.title, fontWeight: '700', color: colors.primaryDark },
  note: { fontSize: font.small, color: colors.muted },
  error: { fontSize: font.body, color: colors.danger },
});
