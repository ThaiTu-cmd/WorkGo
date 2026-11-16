import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { font, radius, spacing, useColors } from './theme';

type Props = TextInputProps & { label: string; error?: string };

export function TextField({ label, error, style, ...input }: Props) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }, error ? styles.inputError : null, style]}
        {...input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: font.small, fontWeight: '600' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
  },
  inputError: { borderColor: '#dc2626' },
  error: { fontSize: font.small, color: '#dc2626' },
});
