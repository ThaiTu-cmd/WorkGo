import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { hasRole } from '@/auth/jwt';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge, Button, Card, Chip, colors, ErrorState, font, Screen, SkeletonList, spacing, TextField } from '@/ui';

import { useCreateProviderProfile, useMyProviderProfile } from './hooks';

const STATUS_TEXT: Record<string, { label: string; hint: string; tone: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Đang chờ duyệt', hint: 'Admin sẽ xem xét hồ sơ của bạn. Sau khi được duyệt, bấm "Cập nhật quyền".', tone: 'warning' },
  VERIFIED: { label: 'Đã duyệt', hint: 'Hồ sơ đã được duyệt. Bấm "Cập nhật quyền" để bắt đầu đăng dịch vụ.', tone: 'success' },
  REJECTED: { label: 'Bị từ chối', hint: 'Hồ sơ chưa đạt yêu cầu. Liên hệ hỗ trợ WorkGo để biết thêm.', tone: 'danger' },
};

export function OnboardingScreen() {
  const signedIn = useRequireAuth();
  const router = useRouter();
  const { claims, refresh } = useAuth();
  const profile = useMyProviderProfile(signedIn);
  const create = useCreateProviderProfile();
  const [providerType, setProviderType] = React.useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [businessName, setBusinessName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  if (!signedIn) return null;
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
          <Button title="Đến dịch vụ của tôi" onPress={() => router.replace('/provider/services')} />
        ) : (
          <Button title="Cập nhật quyền" loading={refreshing} onPress={() => void updateRoles()} />
        )}
      </Screen>
    );
  }

  const submit = () => {
    setError(null);
    if (businessName.trim().length < 2) return setError('Vui lòng nhập tên hiển thị.');
    if (bio.trim().length < 20) return setError('Giới thiệu tối thiểu 20 ký tự.');
    create.mutate(
      { providerType, businessName: businessName.trim(), bio: bio.trim() },
      { onError: (err) => setError(errorMessage(err)) }
    );
  };

  return (
    <Screen edges={['bottom']}>
      <Text style={styles.title}>Trở thành chuyên gia</Text>
      <Text style={styles.muted}>Gửi hồ sơ để admin duyệt. Sau khi được duyệt bạn có thể đăng dịch vụ và nhận đơn.</Text>
      <View style={styles.row}>
        <Chip label="Cá nhân" selected={providerType === 'INDIVIDUAL'} onPress={() => setProviderType('INDIVIDUAL')} />
        <Chip label="Doanh nghiệp" selected={providerType === 'COMPANY'} onPress={() => setProviderType('COMPANY')} />
      </View>
      <TextField label="Tên hiển thị" value={businessName} onChangeText={setBusinessName} />
      <TextField label="Giới thiệu" value={bio} onChangeText={setBio} multiline style={styles.multiline} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Gửi hồ sơ" loading={create.isPending} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title + 2, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.body, color: colors.muted },
  row: { flexDirection: 'row', gap: spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.sm },
  error: { fontSize: font.body, color: colors.danger },
});
