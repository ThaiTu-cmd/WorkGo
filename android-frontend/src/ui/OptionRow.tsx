import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from './theme';

type Props = {
  label: string;
  detail?: string;
  trailing?: string;
  selected: boolean;
  kind: 'checkbox' | 'radio';
  onPress: () => void;
};

// Selectable row for add-ons (checkbox), slots and addresses (radio).
export function OptionRow({ label, detail, trailing, selected, kind, onPress }: Props) {
  const icon =
    kind === 'checkbox' ? (selected ? 'checkbox' : 'square-outline') : selected ? 'radio-button-on' : 'radio-button-off';
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.row, selected && styles.selected]}>
      <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.muted} />
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.primary },
  texts: { flex: 1, gap: 2 },
  label: { fontSize: font.body, color: colors.text },
  detail: { fontSize: font.small, color: colors.muted },
  trailing: { fontSize: font.body, fontWeight: '600', color: colors.text },
});
