import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const PROVINCE_OPTIONS = [
  { label: 'Tất cả địa điểm', value: 'ALL' },
  { label: 'Hà Nội', value: 'Hà Nội' },
  { label: 'TP. Hồ Chí Minh', value: 'Hồ Chí Minh' },
  { label: 'Đà Nẵng', value: 'Đà Nẵng' },
  { label: 'Hải Phòng', value: 'Hải Phòng' },
  { label: 'Cần Thơ', value: 'Cần Thơ' },
] as const;

export interface LocationSectionProps {
  value?: string;
  visible: boolean;
  onChange: (value: string) => void;
}

export function LocationSection({ value = 'ALL', visible, onChange }: LocationSectionProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Khu vực làm việc (Chỉ áp dụng Tại chỗ / Giao hàng)</ThemedText>
      <View style={styles.optionsWrap}>
        {PROVINCE_OPTIONS.map((opt) => {
          const isSelected = (!value && opt.value === 'ALL') || value === opt.value;
          return (
            <PressableScale
              key={opt.value}
              accessibilityRole="button"
              accessibilityLabel={`Chọn địa điểm ${opt.label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(opt.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : theme.text },
                ]}
              >
                {opt.label}
              </ThemedText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
