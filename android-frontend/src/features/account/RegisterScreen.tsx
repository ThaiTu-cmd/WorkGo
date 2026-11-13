import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { Text, type TextInputProps } from 'react-native';
import { z } from 'zod';

import { splitFullName } from '@/api/adapters';
import { authApi } from '@/api/authApi';
import { errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { safeRedirect } from '@/auth/useRequireAuth';
import { Button, font, makeStyles, Screen, TextField } from '@/ui';
import { translate, useT } from '@/i18n';

const schema = z
  .object({
    fullName: z.string().trim().min(2, { error: () => translate('registerScreen.vui_long_nhap_ho_va') }),
    userName: z.string().trim().min(3, { error: () => translate('registerScreen.ten_dang_nhap_toi_thieu') }),
    email: z.string().trim().email({ error: () => translate('registerScreen.email_khong_hop_le') }),
    phone: z.string().trim().regex(/^0\d{9}$/, { error: () => translate('registerScreen.so_dien_thoai_gom_10') }),
    password: z.string().min(8, { error: () => translate('registerScreen.mat_khau_toi_thieu_8') }),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], get message() {
    return translate('registerScreen.mat_khau_nhap_lai_khong');
  } });
type Values = z.infer<typeof schema>;

const FIELDS: { name: FieldPath<Values>; label: string; input?: TextInputProps }[] = [
  { name: 'fullName', get label() {
    return translate('registerScreen.ho_va_ten');
  }, input: { autoComplete: 'name' } },
  { name: 'userName', get label() {
    return translate('registerScreen.ten_dang_nhap');
  }, input: { autoCapitalize: 'none', autoComplete: 'username-new' } },
  { name: 'email', label: 'Email', input: { autoCapitalize: 'none', keyboardType: 'email-address', autoComplete: 'email' } },
  { name: 'phone', get label() {
    return translate('registerScreen.so_dien_thoai');
  }, input: { keyboardType: 'phone-pad', autoComplete: 'tel' } },
  { name: 'password', get label() {
    return translate('registerScreen.mat_khau');
  }, input: { secureTextEntry: true, autoComplete: 'new-password' } },
  { name: 'confirmPassword', get label() {
    return translate('registerScreen.nhap_lai_mat_khau');
  }, input: { secureTextEntry: true } },
];

export function RegisterScreen() {
  const t = useT();
  const styles = useStyles();
  const { signIn } = useAuth();
  const router = useRouter();
  const { redirect, viaLogin } = useLocalSearchParams<{ redirect?: string; viaLogin?: string }>();
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
      // Close register (and the login screen under it, when it came from there).
      const target = safeRedirect(redirect);
      const opened = viaLogin === '1' ? 2 : 1;
      if (target) {
        if (opened > 1) router.dismiss(opened - 1);
        router.replace(target);
      } else if (router.canDismiss()) router.dismiss(opened);
      else router.replace('/');
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <Screen>
      <Text style={styles.title}>{t('registerScreen.tao_tai_khoan')}</Text>
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
      <Button title={t('registerScreen.dang_ky')} loading={isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  formError: { color: colors.danger, fontSize: font.body },
}));
