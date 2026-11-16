import { useColorScheme } from 'react-native';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing } from './theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = true, refreshing = false, onRefresh, edges = ['top'], contentStyle }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? '#121212' : '#f9fafb';
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: bg }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  fill: { flex: 1 },
});