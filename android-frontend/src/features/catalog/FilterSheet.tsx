import * as React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import type { ExecutionType } from '@/api/types';
import { Button, Chip, colors, font, radius, spacing, TextField } from '@/ui';

import type { ServiceFilters } from './filterServices';

type Props = {
  visible: boolean;
  value: ServiceFilters;
  onApply: (next: ServiceFilters) => void;
  onClose: () => void;
};

const toNumberOrUndefined = (text: string) => {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
};

export function FilterSheet({ visible, value, onApply, onClose }: Props) {
  const [type, setType] = React.useState<ExecutionType | undefined>(value.executionType);
  const [min, setMin] = React.useState(value.minPrice?.toString() ?? '');
  const [max, setMax] = React.useState(value.maxPrice?.toString() ?? '');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Bộ lọc</Text>
          <Text style={styles.label}>Hình thức</Text>
          <View style={styles.row}>
            <Chip label="Tất cả" selected={!type} onPress={() => setType(undefined)} />
            <Chip label="Online" selected={type === 'DIGITAL'} onPress={() => setType('DIGITAL')} />
            <Chip label="Tại nhà" selected={type === 'ONSITE'} onPress={() => setType('ONSITE')} />
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label="Giá từ (₫)" keyboardType="number-pad" value={min} onChangeText={setMin} />
            </View>
            <View style={styles.flex}>
              <TextField label="Giá đến (₫)" keyboardType="number-pad" value={max} onChangeText={setMax} />
            </View>
          </View>
          <Button
            title="Áp dụng"
            onPress={() =>
              onApply({ ...value, executionType: type, minPrice: toNumberOrUndefined(min), maxPrice: toNumberOrUndefined(max) })
            }
          />
          <Button
            title="Xoá bộ lọc"
            variant="secondary"
            onPress={() => onApply({ query: value.query, categoryId: value.categoryId })}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
});
