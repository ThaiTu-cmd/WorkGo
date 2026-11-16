import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, type TextInputProps } from 'react-native';

import { errorMessage } from '@/api/errors';
import { LoginRequired } from '@/auth/LoginRequired';
import { useRequireAuth } from '@/auth/useRequireAuth';
import { Button, font, makeStyles, Screen, SkeletonList, TextField } from '@/ui';

import { addressSchema, type AddressFormValues } from './addressSchema';
import { useAddresses, useSaveAddress } from './hooks';
import { translate, useT } from '@/i18n';

const EMPTY: AddressFormValues = { label: '', receiver: '', phone: '', line1: '', ward: '', district: '', city: '', note: '' };

const FIELDS: { name: keyof AddressFormValues; label: string; input?: TextInputProps }[] = [
  { name: 'label', get label() {
    return translate('addressFormScreen.ten_goi_nho_nha_cong');
  } },
  { name: 'receiver', get label() {
    return translate('addressFormScreen.nguoi_nhan');
  } },
  { name: 'phone', get label() {
    return translate('addressFormScreen.so_dien_thoai');
  }, input: { keyboardType: 'phone-pad' } },
  { name: 'line1', get label() {
    return translate('addressFormScreen.so_nha_duong');
  } },
  { name: 'ward', get label() {
    return translate('addressFormScreen.phuong_xa');
  } },
  { name: 'district', get label() {
    return translate('addressFormScreen.quan_huyen');
  } },
  { name: 'city', get label() {
    return translate('addressFormScreen.tinh_thanh_pho');
  } },
  { name: 'note', get label() {
    return translate('addressFormScreen.ghi_chu');
  }, input: { multiline: true } },
];

export function AddressFormScreen() {
  const signedIn = useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const addresses = useAddresses(signedIn && !isNew);

  if (!signedIn) return <LoginRequired edges={['bottom']} />;
  if (!isNew && addresses.isPending) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={4} height={60} />
      </Screen>
    );
  }
  const existing = isNew ? null : (addresses.data ?? []).find((a) => a.id === id);
  const initial: AddressFormValues = existing
    ? { label: existing.label, receiver: existing.receiver, phone: existing.phone, line1: existing.line1, ward: existing.ward, district: existing.district, city: existing.city, note: existing.note }
    : EMPTY;
  return <AddressForm id={isNew ? null : id} initial={initial} />;
}

function AddressForm({ id, initial }: { id: string | null; initial: AddressFormValues }) {
  const t = useT();
  const styles = useStyles();
  const router = useRouter();
  const save = useSaveAddress();
  const [formError, setFormError] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema), defaultValues: initial });

  const onSubmit = handleSubmit(async (form) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id, form });
      router.back();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  });

  return (
    <Screen edges={['bottom']}>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {FIELDS.map(({ name, label, input }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <TextField label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors[name]?.message} {...input} />
          )}
        />
      ))}
      <Button title={id ? t('addressFormScreen.luu_dia_chi') : t('addressFormScreen.them_dia_chi')} loading={isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  error: { color: colors.danger, fontSize: font.body },
}));
