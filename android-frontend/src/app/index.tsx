import { StyleSheet, Text, View } from 'react-native';

// Placeholder until the tab layout lands.
export default function Index() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>WorkGo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700' },
});
