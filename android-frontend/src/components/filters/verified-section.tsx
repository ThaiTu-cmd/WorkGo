import * as React from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface VerifiedSectionProps {
  verifiedOnly: boolean;
  onToggleVerified: (val: boolean) => void;
}

export function VerifiedSection({
  verifiedOnly,
  onToggleVerified,
}: VerifiedSectionProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.switchRow,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.switchInfo}>
        <ThemedText style={styles.switchLabel}>Chuyên gia đã xác thực</ThemedText>
        <ThemedText style={[styles.switchSub, { color: theme.textSecondary }]}>
          Chỉ hiển thị các tài khoản đã hoàn tất xác minh danh tính
        </ThemedText>
      </View>
      <Switch
        value={verifiedOnly}
        onValueChange={onToggleVerified}
        trackColor={{ false: theme.border, true: theme.primary }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1,
  },
  switchInfo: {
    flex: 1,
    marginRight: Spacing.two,
    gap: 2,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 12,
  },
});
