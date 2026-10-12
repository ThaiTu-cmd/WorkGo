import * as React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { type MobileCategory } from '@/api/catalog';
import { type ExecutionType } from '@/api/posts';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface FilterState {
  category?: string;
  executionType?: ExecutionType | 'ALL';
  budgetMin?: number;
  budgetMax?: number;
  verifiedOnly?: boolean;
}

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: MobileCategory[];
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

const PRICE_PRESETS = [
  { label: 'Dưới 500k', min: 0, max: 500000 },
  { label: '500k - 2 triệu', min: 500000, max: 2000000 },
  { label: 'Trên 2 triệu', min: 2000000, max: undefined },
];

const EXEC_OPTIONS: { id: ExecutionType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DIGITAL', label: 'Kỹ thuật số' },
  { id: 'ONSITE', label: 'Tại chỗ' },
  { id: 'DELIVERY', label: 'Giao hàng' },
  { id: 'APPOINTMENT', label: 'Đặt hẹn' },
];

function FilterSheetModalContent({
  onClose,
  categories,
  currentFilters,
  onApply,
  onReset,
}: FilterSheetProps) {
  const theme = useTheme();

  const [category, setCategory] = React.useState<string | undefined>(
    currentFilters.category
  );
  const [execType, setExecType] = React.useState<ExecutionType | 'ALL'>(
    currentFilters.executionType ?? 'ALL'
  );
  const [budgetMin, setBudgetMin] = React.useState<string>(
    currentFilters.budgetMin !== undefined ? String(currentFilters.budgetMin) : ''
  );
  const [budgetMax, setBudgetMax] = React.useState<string>(
    currentFilters.budgetMax !== undefined ? String(currentFilters.budgetMax) : ''
  );
  const [verifiedOnly, setVerifiedOnly] = React.useState<boolean>(
    currentFilters.verifiedOnly ?? false
  );

  const handleApply = () => {
    onApply({
      category: category || undefined,
      executionType: execType === 'ALL' ? undefined : execType,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      verifiedOnly,
    });
    onClose();
  };

  const handleReset = () => {
    setCategory(undefined);
    setExecType('ALL');
    setBudgetMin('');
    setBudgetMax('');
    setVerifiedOnly(false);
    onReset();
    onClose();
  };

  return (
    <View style={styles.backdrop}>
      <View
        style={[
          styles.sheetContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.headerTitle}>Bộ lọc tìm kiếm</ThemedText>
          <PressableScale style={styles.closeBtn} onPress={onClose}>
            <ThemedText style={[styles.closeBtnText, { color: theme.textSecondary }]}>
              ✕
            </ThemedText>
          </PressableScale>
        </View>

        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* Category selection */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Danh mục</ThemedText>
              <View style={styles.chipGrid}>
                <PressableScale
                  style={[
                    styles.chip,
                    {
                      backgroundColor: !category ? theme.primary : theme.backgroundElement,
                      borderColor: !category ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setCategory(undefined)}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      { color: !category ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    Tất cả danh mục
                  </ThemedText>
                </PressableScale>
                {categories.map((c) => {
                  const isSelected = category === c.id;
                  return (
                    <PressableScale
                      key={c.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setCategory(c.id)}
                    >
                      <ThemedText
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}
                      >
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </ThemedText>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          )}

          {/* Execution type */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Hình thức thực hiện</ThemedText>
            <View style={styles.chipGrid}>
              {EXEC_OPTIONS.map((opt) => {
                const isSelected = execType === opt.id;
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
                    onPress={() => setExecType(opt.id)}
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

          {/* Budget Presets and Inputs */}
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
                      setBudgetMin(String(p.min));
                      setBudgetMax(p.max !== undefined ? String(p.max) : '');
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
                onChangeText={setBudgetMin}
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
                onChangeText={setBudgetMax}
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

          {/* Verified Only Switch */}
          <View
            style={[
              styles.switchRow,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.switchInfo}>
              <ThemedText style={styles.switchLabel}>Chuyên gia đã xác thực</ThemedText>
              <ThemedText style={[styles.switchSub, { color: theme.textSecondary }]}>
                Chỉ hiển thị các tài khoản đã hoàn tất xác minh danh tính
              </ThemedText>
            </View>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </ScrollView>

        {/* Action Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <PressableScale
            style={[
              styles.resetBtn,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            onPress={handleReset}
          >
            <ThemedText style={[styles.resetBtnText, { color: theme.textSecondary }]}>
              Xóa bộ lọc
            </ThemedText>
          </PressableScale>
          <PressableScale
            style={[styles.applyBtn, { backgroundColor: theme.primary }]}
            onPress={handleApply}
          >
            <ThemedText style={styles.applyBtnText}>Áp dụng</ThemedText>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

export function FilterSheet(props: FilterSheetProps) {
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent={true}
      onRequestClose={props.onClose}
    >
      {props.visible && <FilterSheetModalContent {...props} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '85%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1,
  },
  switchInfo: {
    flex: 1,
    marginRight: Spacing.two,
    gap: 2,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.four,
    gap: Spacing.three,
    borderTopWidth: 1,
  },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
