import { useRouter } from 'expo-router';
import * as React from 'react';
import { Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge, Button, Card, Chip, ErrorState, font, makeStyles, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { useCreateProviderProfile, useMyProviderProfile } from './hooks';
import { verificationApi } from '@/api/verificationApi';
import { translate, useT } from '@/i18n';

const STATUS_TEXT: Record<string, { label: string; hint: string; tone: 'warning' | 'success' | 'danger' }> = {
  PENDING: {
    get label() {
      return translate('onboardingScreen.dang_cho_duyet');
    },
    get hint() {
      return translate('onboardingScreen.admin_se_xem_xet_ho');
    },
    tone: 'warning',
  },
  VERIFIED: {
    get label() {
      return translate('onboardingScreen.da_duyet');
    },
    get hint() {
      return translate('onboardingScreen.ho_so_da_duoc_duyet');
    },
    tone: 'success',
  },
  REJECTED: {
    get label() {
      return translate('onboardingScreen.bi_tu_choi');
    },
    get hint() {
      return translate('onboardingScreen.ho_so_chua_dat_yeu');
    },
    tone: 'danger',
  },
};

export function OnboardingScreen() {
  const t = useT();
  const styles = useStyles();
  const signedIn = useRequireAuth();
  const router = useRouter();
  const { claims, refresh } = useAuth();
  const profile = useMyProviderProfile(signedIn);
  const create = useCreateProviderProfile();
  const [providerType, setProviderType] = React.useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [businessName, setBusinessName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [cccdNumber, setCccdNumber] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (profile.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={2} height={120} />
      </Screen>
    );
  }
  if (profile.isError) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState message={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
      </Screen>
    );
  }

  const updateRoles = async () => {
    setRefreshing(true);
    const ok = await refresh();
    setRefreshing(false);
    if (ok) router.replace('/provider/services');
  };

  if (profile.data) {
    const s = STATUS_TEXT[profile.data.verificationStatus ?? 'PENDING'] ?? STATUS_TEXT.PENDING;
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Text style={styles.title}>{profile.data.businessName}</Text>
          <Badge label={s.label} tone={s.tone} />
          <Text style={styles.muted}>{s.hint}</Text>
        </Card>
        {hasRole(claims, 'PROVIDER') ? (
          <Button title={t('onboardingScreen.den_dich_vu_cua_toi')} onPress={() => router.replace('/provider/services')} />
        ) : (
          <Button title={t('onboardingScreen.cap_nhat_quyen')} loading={refreshing} onPress={() => void updateRoles()} />
        )}
      </Screen>
    );
  }

  const submit = async () => {
    setError(null);
    if (businessName.trim().length < 2) return setError(t('onboardingScreen.vui_long_nhap_ten_hien'));
    if (bio.trim().length < 20) return setError(t('onboardingScreen.gioi_thieu_toi_thieu_20'));
    try {
      await create.mutateAsync({ providerType, businessName: businessName.trim(), bio: bio.trim() });
      const cleanCccd = cccdNumber.trim();
      if (cleanCccd) {
        await verificationApi.submit({ verificationType: 'IDENTITY_CARD', documentType: `CCCD: ${cleanCccd}` });
      }
    } catch (err) {
      setError(errorMessage(err as Error));
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Text style={styles.title}>{t('onboardingScreen.tro_thanh_chuyen_gia')}</Text>
      <Text style={styles.muted}>{t('onboardingScreen.gui_ho_so_de_admin')}</Text>
      <View style={styles.row}>
        <Chip
          label={t('onboardingScreen.ca_nhan')}
          selected={providerType === 'INDIVIDUAL'}
          onPress={() => setProviderType('INDIVIDUAL')}
        />
        <Chip label={t('onboardingScreen.doanh_nghiep')} selected={providerType === 'COMPANY'} onPress={() => setProviderType('COMPANY')} />
      </View>
      <TextField label={t('onboardingScreen.ten_hien_thi')} value={businessName} onChangeText={setBusinessName} />
      <TextField label={t('onboardingScreen.gioi_thieu')} value={bio} onChangeText={setBio} multiline style={styles.multiline} />
      <TextField label="Số CCCD / Hộ chiếu" value={cccdNumber} onChangeText={setCccdNumber} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={t('onboardingScreen.gui_ho_so')} loading={create.isPending} onPress={() => void submit()} />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.title + 2, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  row: { flexDirection: 'row', gap: spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.sm },
  error: { fontSize: font.body, color: colors.danger },
}));
