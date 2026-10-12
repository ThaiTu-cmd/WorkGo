import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { type ExecutionType } from '@/api/posts';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ExecutionSectionProps {
  selectedExecType: ExecutionType | 'ALL';
  onSelectExecType: (type: ExecutionType | 'ALL') => void;
}

export const EXEC_OPTIONS: { id: ExecutionType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DIGITAL', label: 'Kỹ thuật số' },
  { id: 'ONSITE', label: 'Tại chỗ' },
  { id: 'DELIVERY', label: 'Giao hàng' },
  { id: 'APPOINTMENT', label: 'Đặt hẹn' },
];

export function ExecutionSection({
  selectedExecType,
  onSelectExecType,
}: ExecutionSectionProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Hình thức thực hiện</ThemedText>
      <View style={styles.chipGrid}>
        {EXEC_OPTIONS.map((opt) => {
          const isSelected = selectedExecType === opt.id;
          return (
            <PressableScale
              key={opt.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => onSelectExecType(opt.id)}
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
});
