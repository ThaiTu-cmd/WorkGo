import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { StyleSheet, Text, type TextInputProps } from 'react-native';
import { z } from 'zod';

import { splitFullName } from '@/api/adapters';
import { authApi } from '@/api/authApi';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { safeRedirect } from '@/auth/useRequireAuth';
import { Button, colors, font, Screen, TextField } from '@/ui';

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên'),
    userName: z.string().trim().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
    email: z.string().trim().email('Email không hợp lệ'),
    phone: z.string().trim().regex(/^0\d{9}$/, 'Số điện thoại gồm 10 số, bắt đầu bằng 0'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' });
type Values = z.infer<typeof schema>;

const FIELDS: { name: FieldPath<Values>; label: string; input?: TextInputProps }[] = [
  { name: 'fullName', label: 'Họ và tên', input: { autoComplete: 'name' } },
  { name: 'userName', label: 'Tên đăng nhập', input: { autoCapitalize: 'none', autoComplete: 'username-new' } },
  { name: 'email', label: 'Email', input: { autoCapitalize: 'none', keyboardType: 'email-address', autoComplete: 'email' } },
  { name: 'phone', label: 'Số điện thoại', input: { keyboardType: 'phone-pad', autoComplete: 'tel' } },
  { name: 'password', label: 'Mật khẩu', input: { secureTextEntry: true, autoComplete: 'new-password' } },
  { name: 'confirmPassword', label: 'Nhập lại mật khẩu', input: { secureTextEntry: true } },
];

export function RegisterScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [formError, setFormError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', userName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await authApi.register({
        ...splitFullName(v.fullName),
        userName: v.userName.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        password: v.password,
      });
      await signIn(v.userName.trim(), v.password);
      router.replace(safeRedirect(redirect));
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <Screen>
      <Text style={styles.title}>Tạo tài khoản</Text>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      {FIELDS.map(({ name, label, input }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <TextField
              label={label}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors[name]?.message}
              {...input}
            />
          )}
        />
      ))}
      <Button title="Đăng ký" loading={isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  formError: { color: colors.danger, fontSize: font.body },
});
