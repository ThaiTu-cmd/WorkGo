import * as React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';

export interface OfflineBannerProps {
  onRetry?: () => void;
  message?: string;
  retryLabel?: string;
}

export function OfflineBanner({
  onRetry,
  message = 'Bạn đang ngoại tuyến. Vui lòng kiểm tra kết nối mạng.',
  retryLabel = 'Thử lại',
}: OfflineBannerProps) {
  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
