import * as React from 'react';
import { Modal, Text, View } from 'react-native';

import type { ExecutionType } from '@/api/types';
import { Button, Chip, font, makeStyles, radius, spacing, TextField } from '@/ui';

import type { ServiceFilters } from './filterServices';
import { useT } from '@/i18n';

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
  const t = useT();
  const styles = useStyles();
  const [type, setType] = React.useState<ExecutionType | undefined>(value.executionType);
  const [min, setMin] = React.useState(value.minPrice?.toString() ?? '');
  const [max, setMax] = React.useState(value.maxPrice?.toString() ?? '');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('filterSheet.bo_loc')}</Text>
          <Text style={styles.label}>{t('filterSheet.hinh_thuc')}</Text>
          <View style={styles.row}>
            <Chip label={t('filterSheet.tat_ca')} selected={!type} onPress={() => setType(undefined)} />
            <Chip label="Online" selected={type === 'DIGITAL'} onPress={() => setType('DIGITAL')} />
            <Chip label={t('filterSheet.tai_nha')} selected={type === 'ONSITE'} onPress={() => setType('ONSITE')} />
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label={t('filterSheet.gia_tu')} keyboardType="number-pad" value={min} onChangeText={setMin} />
            </View>
            <View style={styles.flex}>
              <TextField label={t('filterSheet.gia_den')} keyboardType="number-pad" value={max} onChangeText={setMax} />
            </View>
          </View>
          <Button
            title={t('filterSheet.ap_dung')}
            onPress={() =>
              onApply({ ...value, executionType: type, minPrice: toNumberOrUndefined(min), maxPrice: toNumberOrUndefined(max) })
            }
          />
          <Button
            title={t('filterSheet.xoa_bo_loc')}
            variant="secondary"
            onPress={() => onApply({ query: value.query, categoryId: value.categoryId })}
          />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
  label: { fontSize: font.small, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
}));
