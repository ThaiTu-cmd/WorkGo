import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ExecutionTypeChip =
  | 'ALL'
  | 'DIGITAL'
  | 'ONSITE'
  | 'DELIVERY'
  | 'APPOINTMENT';

const EXEC_CHIPS: { id: ExecutionTypeChip; label: string; badge?: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DIGITAL', label: 'Kỹ thuật số' },
  { id: 'ONSITE', label: 'Tại chỗ' },
  { id: 'DELIVERY', label: 'Giao hàng' },
  { id: 'APPOINTMENT', label: 'Đặt hẹn', badge: 'Sắp ra mắt' },
];

export interface SearchBarProps {
  query: string;
  onChangeQuery: (q: string) => void;
  onSubmitQuery?: () => void;
  selectedExecType: ExecutionTypeChip;
  onSelectExecType: (type: ExecutionTypeChip) => void;
  onOpenFilter?: () => void;
  activeFilterCount?: number;
}

export function SearchBar({
  query,
  onChangeQuery,
  onSubmitQuery,
  selectedExecType,
  onSelectExecType,
  onOpenFilter,
  activeFilterCount = 0,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Search Input Row */}
      <View style={styles.inputRow}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            onSubmitEditing={onSubmitQuery}
            returnKeyType="search"
            placeholder="Tìm việc, chuyên gia, dịch vụ..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.textInput, { color: theme.text }]}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <PressableScale
              style={styles.clearButton}
              onPress={() => onChangeQuery('')}
            >
              <ThemedText style={[styles.clearIcon, { color: theme.textSecondary }]}>
                ✕
              </ThemedText>
            </PressableScale>
          )}
        </View>

        {onOpenFilter && (
          <PressableScale
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilterCount > 0 ? theme.primarySubtle : theme.surface,
                borderColor: activeFilterCount > 0 ? theme.primary : theme.border,
              },
            ]}
            onPress={onOpenFilter}
          >
            <ThemedText style={styles.filterIcon}>⚙️</ThemedText>
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </View>
            )}
          </PressableScale>
        )}
      </View>

      {/* Execution Type Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {EXEC_CHIPS.map((chip) => {
          const isSelected = selectedExecType === chip.id;
          return (
            <PressableScale
              key={chip.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => onSelectExecType(chip.id)}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : theme.text },
                ]}
              >
                {chip.label}
              </ThemedText>
              {chip.badge && (
                <View
                  style={[
                    styles.chipBadge,
                    {
                      backgroundColor: isSelected ? '#FFFFFF' : theme.primarySubtle,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.chipBadgeText,
                      { color: isSelected ? theme.primary : theme.primary },
                    ]}
                  >
                    {chip.badge}
                  </ThemedText>
                </View>
              )}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.two,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    padding: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterIcon: {
    fontSize: 18,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  chipsScroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: Spacing.one,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
