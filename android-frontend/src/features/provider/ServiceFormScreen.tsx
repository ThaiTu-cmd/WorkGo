import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import type { ServiceStatus } from '@/api/types';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { useCategories, useServiceDetail } from '@/features/catalog/hooks';
import { pickImage } from '@/lib/image';
import { Button, Chip, colors, ErrorState, font, radius, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { useSaveService } from './hooks';
import {
  MAX_SERVICE_IMAGES,
  packagesSchema,
  serviceInfoSchema,
  type PackageInput,
  type ServiceInfo,
} from './serviceFormSchema';

type PackageDraft = { id?: string; name: string; price: string; deliveryDay: string; durationMinute: string; revisionLimit: string };

const EMPTY_PACKAGE: PackageDraft = { name: '', price: '', deliveryDay: '', durationMinute: '', revisionLimit: '' };
const STEPS = ['Thông tin', 'Gói & giá', 'Ảnh'] as const;

const intOrUndefined = (s: string) => (s.trim() ? Number(s.replace(/\D/g, '')) : undefined);
const toPackageInput = (d: PackageDraft): PackageInput => ({
  id: d.id,
  name: d.name,
  price: Number(d.price.replace(/\D/g, '') || 0),
  deliveryDay: intOrUndefined(d.deliveryDay),
  durationMinute: intOrUndefined(d.durationMinute),
  revisionLimit: intOrUndefined(d.revisionLimit),
});

export function ServiceFormScreen() {
  const signedIn = useRequireAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useServiceDetail(id);
  if (!signedIn) return null;
  if (id && existing.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={3} height={80} />
      </Screen>
    );
  }
  if (id && (existing.isError || !existing.data)) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState message={errorMessage(existing.error)} onRetry={() => void existing.refetch()} />
      </Screen>
    );
  }
  const d = existing.data;
  return (
    <ServiceForm
      serviceId={id ?? null}
      currentStatus={d?.status}
      initialInfo={{
        title: d?.title ?? '',
        categoryId: d?.categoryId ?? '',
        executionType: d?.executionType ?? 'DIGITAL',
        description: d?.description ?? '',
      }}
      initialPackages={
        d?.packages.length
          ? d.packages.map((p) => ({
              id: p.id,
              name: p.name,
              price: String(p.price),
              deliveryDay: p.deliveryDays?.toString() ?? '',
              durationMinute: p.durationMinute?.toString() ?? '',
              revisionLimit: p.revisionLimit ? String(p.revisionLimit) : '',
            }))
          : [EMPTY_PACKAGE]
      }
      existingImages={d?.mediaList.map((m) => m.url) ?? []}
    />
  );
}

function ServiceForm({
  serviceId,
  currentStatus,
  initialInfo,
  initialPackages,
  existingImages,
}: {
  serviceId: string | null;
  currentStatus?: ServiceStatus;
  initialInfo: ServiceInfo;
  initialPackages: PackageDraft[];
  existingImages: string[];
}) {
  const router = useRouter();
  const categories = useCategories();
  const save = useSaveService();
  const [step, setStep] = React.useState(0);
  const [info, setInfo] = React.useState<ServiceInfo>(initialInfo);
  const [packages, setPackages] = React.useState<PackageDraft[]>(initialPackages);
  const [images, setImages] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const firstIssue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message ?? null;

  const next = () => {
    setError(null);
    if (step === 0) {
      const issue = firstIssue(serviceInfoSchema.safeParse(info));
      if (issue) return setError(issue);
    }
    if (step === 1) {
      const issue = firstIssue(packagesSchema.safeParse({ packages: packages.map(toPackageInput) }));
      if (issue) return setError(issue);
    }
    setStep((s) => s + 1);
  };

  const addImage = async (source: 'camera' | 'library') => {
    setError(null);
    try {
      const picked = await pickImage(source);
      if (picked) setImages((list) => [...list, picked.dataUrl]);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const submit = () => {
    setError(null);
    save.mutate(
      {
        serviceId,
        currentStatus,
        info,
        packages: packages.map(toPackageInput),
        images,
        hasCover: existingImages.length > 0,
      },
      { onSuccess: () => router.back(), onError: (err) => setError(errorMessage(err)) }
    );
  };

  const setPkg = (i: number, patch: Partial<PackageDraft>) =>
    setPackages((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <Screen edges={['bottom']}>
      <View style={styles.stepper}>
        {STEPS.map((label, i) => (
          <View key={label} style={[styles.step, i <= step && styles.stepActive]}>
            <Text style={[styles.stepText, i <= step && styles.stepTextActive]}>
              {i + 1}. {label}
            </Text>
          </View>
        ))}
      </View>

      {step === 0 ? (
        <>
          <TextField label="Tiêu đề" value={info.title} onChangeText={(title) => setInfo({ ...info, title })} />
          <Text style={styles.label}>Danh mục</Text>
          <View style={styles.wrap}>
            {(categories.data?.all ?? []).map((c) => (
              <Chip key={c.categoryId} label={c.name} selected={info.categoryId === c.categoryId} onPress={() => setInfo({ ...info, categoryId: c.categoryId })} />
            ))}
          </View>
          <Text style={styles.label}>Hình thức</Text>
          <View style={styles.wrap}>
            <Chip label="Online" selected={info.executionType === 'DIGITAL'} onPress={() => setInfo({ ...info, executionType: 'DIGITAL' })} />
            <Chip label="Tại nhà" selected={info.executionType === 'ONSITE'} onPress={() => setInfo({ ...info, executionType: 'ONSITE' })} />
          </View>
          <TextField
            label="Mô tả"
            multiline
            style={styles.multiline}
            value={info.description}
            onChangeText={(description) => setInfo({ ...info, description })}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          {packages.map((p, i) => (
            <View key={p.id ?? `new-${i}`} style={styles.pkg}>
              <Text style={styles.label}>Gói {i + 1}</Text>
              <TextField label="Tên gói" value={p.name} onChangeText={(name) => setPkg(i, { name })} />
              <TextField label="Giá (₫)" keyboardType="number-pad" value={p.price} onChangeText={(price) => setPkg(i, { price })} />
              <View style={styles.row}>
                <View style={styles.flex}>
                  <TextField label="Số ngày giao" keyboardType="number-pad" value={p.deliveryDay} onChangeText={(deliveryDay) => setPkg(i, { deliveryDay })} />
                </View>
                <View style={styles.flex}>
                  <TextField label="Thời lượng (phút)" keyboardType="number-pad" value={p.durationMinute} onChangeText={(durationMinute) => setPkg(i, { durationMinute })} />
                </View>
              </View>
              <TextField label="Số lần chỉnh sửa" keyboardType="number-pad" value={p.revisionLimit} onChangeText={(revisionLimit) => setPkg(i, { revisionLimit })} />
              {!p.id && packages.length > 1 ? (
                <Button title="Bỏ gói này" variant="secondary" onPress={() => setPackages((list) => list.filter((_, j) => j !== i))} />
              ) : null}
            </View>
          ))}
          {packages.length < 3 ? <Button title="Thêm gói" variant="secondary" onPress={() => setPackages((l) => [...l, EMPTY_PACKAGE])} /> : null}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={styles.muted}>Tối đa {MAX_SERVICE_IMAGES} ảnh mới. Ảnh đầu tiên là ảnh bìa nếu dịch vụ chưa có ảnh.</Text>
          <View style={styles.wrap}>
            {[...existingImages, ...images].map((uri, i) => (
              <Pressable
                key={`${i}-${uri.length}`}
                accessibilityLabel={i < existingImages.length ? 'Ảnh đã có' : 'Bỏ ảnh này'}
                disabled={i < existingImages.length}
                onPress={() => setImages((list) => list.filter((_, j) => j !== i - existingImages.length))}>
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              </Pressable>
            ))}
          </View>
          {images.length < MAX_SERVICE_IMAGES ? (
            <View style={styles.row}>
              <Button title="Chụp ảnh" variant="secondary" style={styles.flex} onPress={() => void addImage('camera')} />
              <Button title="Chọn ảnh" variant="secondary" style={styles.flex} onPress={() => void addImage('library')} />
            </View>
          ) : null}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        {step > 0 ? <Button title="Quay lại" variant="secondary" style={styles.flex} onPress={() => setStep((s) => s - 1)} /> : null}
        {step < STEPS.length - 1 ? (
          <Button title="Tiếp" style={styles.flex} onPress={next} />
        ) : (
          <Button title={serviceId ? 'Lưu thay đổi' : 'Đăng dịch vụ'} style={styles.flex} loading={save.isPending} onPress={submit} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', gap: spacing.xs },
  step: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.border, alignItems: 'center' },
  stepActive: { backgroundColor: colors.primary },
  stepText: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  stepTextActive: { color: colors.white },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  multiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: spacing.sm },
  pkg: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  thumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.border },
  error: { fontSize: font.body, color: colors.danger },
});
