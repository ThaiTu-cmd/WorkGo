import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const PRICE_PRESETS = [
  { label: 'Dưới 500k', min: 0, max: 500000 },
  { label: '500k - 2 triệu', min: 500000, max: 2000000 },
  { label: 'Trên 2 triệu', min: 2000000, max: undefined },
];

export interface BudgetSectionProps {
  budgetMin: string;
  budgetMax: string;
  onChangeMin: (val: string) => void;
  onChangeMax: (val: string) => void;
}

export function BudgetSection({
  budgetMin,
  budgetMax,
  onChangeMin,
  onChangeMax,
}: BudgetSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Ngân sách (VNĐ)</ThemedText>
      <View style={styles.chipGrid}>
        {PRICE_PRESETS.map((p) => {
          const isSelected =
            budgetMin === String(p.min) &&
            (p.max === undefined ? !budgetMax : budgetMax === String(p.max));
          return (
            <PressableScale
              key={p.label}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                onChangeMin(String(p.min));
                onChangeMax(p.max !== undefined ? String(p.max) : '');
              }}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : theme.text },
                ]}
              >
                {p.label}
              </ThemedText>
            </PressableScale>
          );
        })}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={budgetMin}
          onChangeText={onChangeMin}
          keyboardType="numeric"
          placeholder="Tối thiểu"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.priceInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        />
        <ThemedText style={styles.rangeDash}>—</ThemedText>
        <TextInput
          value={budgetMax}
          onChangeText={onChangeMax}
          keyboardType="numeric"
          placeholder="Tối đa"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.priceInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  priceInput: {
    flex: 1,
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  rangeDash: {
    fontSize: 16,
  },
});
