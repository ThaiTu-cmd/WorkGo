import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

// Initial-letter avatar so no image service is needed.
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letter = (String(name || '?').trim()[0] || '?').toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.white, fontWeight: '700' },
});
