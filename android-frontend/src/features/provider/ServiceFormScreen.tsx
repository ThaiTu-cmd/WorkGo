import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import { catalogErrorMessage, errorMessage } from '@/api/errors';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { useCategories, useServiceDetail } from '@/features/catalog/hooks';
import { pickImage } from '@/lib/image';
import { useSingleFlight } from '@/lib/useSingleFlight';
import { Button, Chip, ErrorState, font, makeStyles, radius, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { newSaveProgress, useSaveService, type SaveProgress } from './hooks';
import {
  MAX_SERVICE_IMAGES,
  packagesSchema,
  serviceInfoSchema,
  type PackageInput,
  type ServiceInfo,
} from './serviceFormSchema';
import { translate, useT } from '@/i18n';

type PackageDraft = { id?: string; name: string; price: string; deliveryDay: string; durationMinute: string; revisionLimit: string };

const EMPTY_PACKAGE: PackageDraft = { name: '', price: '', deliveryDay: '', durationMinute: '', revisionLimit: '' };
const stepLabels = () => [translate('serviceFormScreen.thong_tin'), translate('serviceFormScreen.goi_gia'), translate('serviceFormScreen.anh')];

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
  if (!signedIn) return <LoginRequired edges={['bottom']} />;
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
      currentSlug={d?.slug}
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
  currentSlug,
  initialInfo,
  initialPackages,
  existingImages,
}: {
  serviceId: string | null;
  currentSlug?: string;
  initialInfo: ServiceInfo;
  initialPackages: PackageDraft[];
  existingImages: string[];
}) {
  const t = useT();
  const styles = useStyles();
  const router = useRouter();
  const categories = useCategories();
  const save = useSaveService();
  const once = useSingleFlight();
  // Survives a failed save so "Đăng dịch vụ" again continues where it stopped.
  const progress = React.useRef<SaveProgress>(newSaveProgress());
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
    void once(() =>
      save
        .mutateAsync({
          input: {
            serviceId,
            currentSlug,
            info,
            packages: packages.map(toPackageInput),
            images,
            hasCover: existingImages.length > 0,
          },
          progress: progress.current,
        })
        .then(
          () => router.back(),
          (err) => setError(catalogErrorMessage(err))
        )
    );
  };

  const setPkg = (i: number, patch: Partial<PackageDraft>) =>
    setPackages((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <Screen edges={['bottom']}>
      <View style={styles.stepper}>
        {stepLabels().map((label, i) => (
          <View key={label} style={[styles.step, i <= step && styles.stepActive]}>
            <Text style={[styles.stepText, i <= step && styles.stepTextActive]}>
              {i + 1}. {label}
            </Text>
          </View>
        ))}
      </View>

      {step === 0 ? (
        <>
          <TextField label={t('serviceFormScreen.tieu_de')} value={info.title} onChangeText={(title) => setInfo({ ...info, title })} />
          <Text style={styles.label}>{t('serviceFormScreen.danh_muc')}</Text>
          <View style={styles.wrap}>
            {(categories.data?.all ?? []).map((c) => (
              <Chip key={c.categoryId} label={c.name} selected={info.categoryId === c.categoryId} onPress={() => setInfo({ ...info, categoryId: c.categoryId })} />
            ))}
          </View>
          <Text style={styles.label}>{t('serviceFormScreen.hinh_thuc')}</Text>
          <View style={styles.wrap}>
            <Chip label="Online" selected={info.executionType === 'DIGITAL'} onPress={() => setInfo({ ...info, executionType: 'DIGITAL' })} />
            <Chip label={t('serviceFormScreen.tai_nha')} selected={info.executionType === 'ONSITE'} onPress={() => setInfo({ ...info, executionType: 'ONSITE' })} />
          </View>
          <TextField
            label={t('serviceFormScreen.mo_ta')}
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
              <Text style={styles.label}>{t('serviceFormScreen.goi', { p0: i + 1 })}</Text>
              <TextField label={t('serviceFormScreen.ten_goi')} value={p.name} onChangeText={(name) => setPkg(i, { name })} />
              <TextField label={t('serviceFormScreen.gia')} keyboardType="number-pad" value={p.price} onChangeText={(price) => setPkg(i, { price })} />
              <View style={styles.row}>
                <View style={styles.flex}>
                  <TextField label={t('serviceFormScreen.so_ngay_giao')} keyboardType="number-pad" value={p.deliveryDay} onChangeText={(deliveryDay) => setPkg(i, { deliveryDay })} />
                </View>
                <View style={styles.flex}>
                  <TextField label={t('serviceFormScreen.thoi_luong_phut')} keyboardType="number-pad" value={p.durationMinute} onChangeText={(durationMinute) => setPkg(i, { durationMinute })} />
                </View>
              </View>
              <TextField label={t('serviceFormScreen.so_lan_chinh_sua')} keyboardType="number-pad" value={p.revisionLimit} onChangeText={(revisionLimit) => setPkg(i, { revisionLimit })} />
              {!p.id && packages.length > 1 ? (
                <Button title={t('serviceFormScreen.bo_goi_nay')} variant="secondary" onPress={() => setPackages((list) => list.filter((_, j) => j !== i))} />
              ) : null}
            </View>
          ))}
          {packages.length < 3 ? <Button title={t('serviceFormScreen.them_goi')} variant="secondary" onPress={() => setPackages((l) => [...l, EMPTY_PACKAGE])} /> : null}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={styles.muted}>{t('serviceFormScreen.toi_da_anh_moi_anh', { p0: MAX_SERVICE_IMAGES })}</Text>
          <View style={styles.wrap}>
            {[...existingImages, ...images].map((uri, i) => (
              <Pressable
                key={`${i}-${uri.length}`}
                accessibilityLabel={i < existingImages.length ? t('serviceFormScreen.anh_da_co') : t('serviceFormScreen.bo_anh_nay')}
                disabled={i < existingImages.length}
                onPress={() => setImages((list) => list.filter((_, j) => j !== i - existingImages.length))}>
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              </Pressable>
            ))}
          </View>
          {images.length < MAX_SERVICE_IMAGES ? (
            <View style={styles.row}>
              <Button title={t('serviceFormScreen.chup_anh')} variant="secondary" style={styles.flex} onPress={() => void addImage('camera')} />
              <Button title={t('serviceFormScreen.chon_anh')} variant="secondary" style={styles.flex} onPress={() => void addImage('library')} />
            </View>
          ) : null}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        {step > 0 ? <Button title={t('serviceFormScreen.quay_lai')} variant="secondary" style={styles.flex} onPress={() => setStep((s) => s - 1)} /> : null}
        {step < stepLabels().length - 1 ? (
          <Button title={t('serviceFormScreen.tiep')} style={styles.flex} onPress={next} />
        ) : (
          <Button title={serviceId ? t('serviceFormScreen.luu_thay_doi') : t('serviceFormScreen.dang_dich_vu')} style={styles.flex} loading={save.isPending} onPress={submit} />
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  stepper: { flexDirection: 'row', gap: spacing.xs },
  step: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.border, alignItems: 'center' },
  stepActive: { backgroundColor: colors.primary },
  stepText: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  stepTextActive: { color: colors.white },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  multiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: spacing.sm },
  pkg: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  thumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.border },
  error: { fontSize: font.body, color: colors.danger },
}));
