import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { ApiError, errorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';
import { safeRedirect } from '@/auth/useRequireAuth';
import { Button, font, makeStyles, Screen, TextField } from '@/ui';
import { translate, useT } from '@/i18n';

const schema = z.object({
  userName: z.string().trim().min(1, { error: () => translate('loginScreen.vui_long_nhap_ten_dang') }),
  password: z.string().min(1, { error: () => translate('loginScreen.vui_long_nhap_mat_khau') }),
});
type Values = z.infer<typeof schema>;

export function LoginScreen() {
  const t = useT();
  const styles = useStyles();
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
      // With a destination, login turns into it; otherwise return to whatever opened login.
      const target = safeRedirect(redirect);
      if (target) router.replace(target);
      else if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (err) {
      // Unknown user (404, code 1006) reads like a wrong password: don't reveal which usernames exist.
      const badCredentials = err instanceof ApiError && (err.status === 401 || (err.status === 404 && err.code === 1006));
      setFormError(badCredentials ? t('loginScreen.sai_ten_dang_nhap_hoac') : errorMessage(err));
    }
  });

  return (
    <Screen>
      <Text style={styles.title}>{t('loginScreen.dang_nhap_workgo')}</Text>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <Controller
        control={control}
        name="userName"
        render={({ field }) => (
          <TextField
            label={t('loginScreen.ten_dang_nhap')}
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
            label={t('loginScreen.mat_khau')}
            secureTextEntry
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Button title={t('loginScreen.dang_nhap')} loading={isSubmitting} onPress={onSubmit} />
      <Link href={{ pathname: '/auth/register', params: { viaLogin: '1', ...(redirect ? { redirect } : {}) } }} style={styles.link}>{t('loginScreen.chua_co_tai_khoan_dang')}</Link>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  title: { fontSize: font.hero, fontWeight: '700', color: colors.text },
  formError: { color: colors.danger, fontSize: font.body },
  link: { color: colors.primaryDark, fontSize: font.body, textAlign: 'center', paddingVertical: 8 },
}));
