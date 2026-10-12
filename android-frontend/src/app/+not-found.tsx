import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableScale } from '@/components/pressable-scale';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.primarySubtle, borderColor: theme.border },
        ]}
      >
        <ThemedText style={styles.icon}>🔍</ThemedText>
      </View>
      <ThemedText type="hero" style={styles.code}>
        404
      </ThemedText>
      <ThemedText style={styles.title}>Không tìm thấy trang</ThemedText>
      <ThemedText style={[styles.desc, { color: theme.textSecondary }]}>
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
      </ThemedText>
      <PressableScale
        style={[styles.btn, { backgroundColor: theme.primary }]}
        onPress={() => router.replace('/')}
      >
        <ThemedText style={styles.btnText}>Quay về trang chủ</ThemedText>
      </PressableScale>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  icon: {
    fontSize: 32,
  },
  code: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: Spacing.five,
    lineHeight: 20,
  },
  btn: {
    height: 48,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
