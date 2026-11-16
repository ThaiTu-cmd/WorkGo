import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, radius, spacing, useColors } from './theme';

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
  const c = useColors();
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.row, { backgroundColor: c.card, borderColor: selected ? c.primary : c.border }]}>
      <Ionicons name={icon} size={22} color={selected ? c.primary : c.muted} />
      <View style={styles.texts}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        {detail ? <Text style={[styles.detail, { color: c.muted }]}>{detail}</Text> : null}
      </View>
      {trailing ? <Text style={[styles.trailing, { color: c.text }]}>{trailing}</Text> : null}
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
    borderRadius: radius.md,
  },
  texts: { flex: 1, gap: 2 },
  label: { fontSize: font.body },
  detail: { fontSize: font.small },
  trailing: { fontSize: font.body, fontWeight: '600' },
});
