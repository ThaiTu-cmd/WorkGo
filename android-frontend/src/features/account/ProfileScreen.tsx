import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { z } from 'zod';

import { joinFullName, splitFullName } from '@/api/adapters';
import { errorMessage } from '@/api/errors';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Button, colors, ErrorState, font, Screen, SkeletonList, TextField } from '@/ui';

import { PHONE_MESSAGE } from './addressSchema';
import { useMe, useUpdateMe } from './hooks';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên'),
  email: z.string().trim().email('Email không hợp lệ'),
  phone: z.string().trim().regex(/^0\d{9}$/, PHONE_MESSAGE),
});
type Values = z.infer<typeof schema>;

export function ProfileScreen() {
  const signedIn = useRequireAuth();
  const me = useMe(signedIn);
  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (me.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={3} height={60} />
      </Screen>
    );
  }
  if (me.isError || !me.data) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState message={errorMessage(me.error)} onRetry={() => void me.refetch()} />
      </Screen>
    );
  }
  return (
    <ProfileForm
      initial={{ fullName: joinFullName(me.data), email: me.data.email ?? '', phone: me.data.phone ?? '' }}
    />
  );
}

function ProfileForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const update = useUpdateMe();
  const [formError, setFormError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await update.mutateAsync({ ...splitFullName(v.fullName), email: v.email.trim(), phone: v.phone.trim() });
      router.back();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  const field = (name: keyof Values, label: string, extra: object = {}) => (
    <Controller
      control={control}
      name={name}
      render={({ field: f }) => (
        <TextField label={label} value={f.value} onChangeText={f.onChange} onBlur={f.onBlur} error={errors[name]?.message} {...extra} />
      )}
    />
  );

  return (
    <Screen edges={['bottom']}>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {field('fullName', 'Họ và tên')}
      {field('email', 'Email', { autoCapitalize: 'none', keyboardType: 'email-address' })}
      {field('phone', 'Số điện thoại', { keyboardType: 'phone-pad' })}
      <Button title="Lưu" loading={isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: font.body },
});
