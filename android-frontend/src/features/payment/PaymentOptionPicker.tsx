import { View } from 'react-native';

import { OptionRow, spacing } from '@/ui';

import { MOCK_PAYMENT_ENABLED, paymentOptions } from './payment';

export function PaymentOptionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
      {paymentOptions(MOCK_PAYMENT_ENABLED).map((o) => (
        <OptionRow key={o.id} kind="radio" label={o.name} detail={o.description} selected={value === o.id} onPress={() => onChange(o.id)} />
      ))}
    </View>
  );
}
