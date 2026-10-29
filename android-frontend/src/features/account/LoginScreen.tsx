import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { z } from 'zod';

import { ApiError, errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { safeRedirect } from '@/auth/useRequireAuth';
import { Button, colors, font, Screen, TextField } from '@/ui';

const schema = z.object({
  userName: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type Values = z.infer<typeof schema>;

export function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [formError, setFormError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { userName: '', password: '' } });

  const onSubmit = handleSubmit(async ({ userName, password }) => {
    setFormError(null);
    try {
      await signIn(userName.trim(), password);
      router.replace(safeRedirect(redirect));
    } catch (err) {
      setFormError(err instanceof ApiError && err.status === 401 ? 'Sai tên đăng nhập hoặc mật khẩu.' : errorMessage(err));
    }
  });

  return (
    <Screen>
      <Text style={styles.title}>Đăng nhập WorkGo</Text>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <Controller
        control={control}
        name="userName"
        render={({ field }) => (
          <TextField
            label="Tên đăng nhập"
            autoCapitalize="none"
            autoComplete="username"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.userName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu"
            secureTextEntry
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Button title="Đăng nhập" loading={isSubmitting} onPress={onSubmit} />
      <Link href={{ pathname: '/auth/register', params: redirect ? { redirect } : {} }} style={styles.link}>
        Chưa có tài khoản? Đăng ký
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  formError: { color: colors.danger, fontSize: font.body },
  link: { color: colors.primaryDark, fontSize: font.body, textAlign: 'center', paddingVertical: 8 },
});
