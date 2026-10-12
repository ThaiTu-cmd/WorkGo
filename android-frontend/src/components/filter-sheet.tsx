import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { type MobileCategory } from '@/api/catalog';
import { type ExecutionType } from '@/api/posts';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CategorySection } from './filters/category-section';
import { ExecutionSection } from './filters/execution-section';
import { BudgetSection } from './filters/budget-section';
import { VerifiedSection } from './filters/verified-section';
import { LocationSection } from './filters/location-section';

export interface FilterState {
  category?: string;
  executionType?: ExecutionType | 'ALL';
  budgetMin?: number;
  budgetMax?: number;
  verifiedOnly?: boolean;
  location?: string;
}

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: MobileCategory[];
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

function FilterSheetModalContent({
  onClose,
  categories,
  currentFilters,
  onApply,
  onReset,
}: FilterSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
  const [location, setLocation] = React.useState<string>(
    currentFilters.location ?? 'ALL'
  );

  const handleApply = () => {
    onApply({
      category: category || undefined,
      executionType: execType === 'ALL' ? undefined : execType,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      verifiedOnly,
      location: location !== 'ALL' ? location : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setCategory(undefined);
    setExecType('ALL');
    setBudgetMin('');
    setBudgetMax('');
    setVerifiedOnly(false);
    setLocation('ALL');
    onReset();
    onClose();
  };

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Đóng bộ lọc"
      />
      <View
        style={[
          styles.sheetContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.headerTitle}>Bộ lọc tìm kiếm</ThemedText>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Đóng bộ lọc"
            accessibilityHint="Đóng bảng bộ lọc tìm kiếm"
            style={styles.closeBtn}
            onPress={onClose}
          >
            <ThemedText style={[styles.closeBtnText, { color: theme.textSecondary }]}>
              ✕
            </ThemedText>
          </PressableScale>
        </View>

        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* Category selection */}
          <CategorySection
            categories={categories}
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          {/* Execution type */}
          <ExecutionSection
            selectedExecType={execType}
            onSelectExecType={setExecType}
          />

          {/* Location filter (only for ONSITE / DELIVERY) */}
          <LocationSection
            value={location}
            visible={execType === 'ONSITE' || execType === 'DELIVERY'}
            onChange={setLocation}
          />

          {/* Budget Presets and Inputs */}
          <BudgetSection
            budgetMin={budgetMin}
            budgetMax={budgetMax}
            onChangeMin={setBudgetMin}
            onChangeMax={setBudgetMax}
          />

          {/* Verified Only Switch */}
          <VerifiedSection
            verifiedOnly={verifiedOnly}
            onToggleVerified={setVerifiedOnly}
          />
        </ScrollView>

        {/* Action Footer */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: theme.border,
              paddingBottom: Math.max(Spacing.four, insets.bottom),
            },
          ]}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Xóa bộ lọc"
            accessibilityHint="Xóa toàn bộ tiêu chí lọc đã chọn"
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
            accessibilityRole="button"
            accessibilityLabel="Áp dụng bộ lọc"
            accessibilityHint="Áp dụng các tiêu chí lọc đã chọn vào danh sách công việc"
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
      statusBarTranslucent={true}
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
