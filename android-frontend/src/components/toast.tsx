import * as React from 'react';
import { StyleSheet, Text, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticFeedback } from '@/utils/haptics';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export interface ToastData {
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastContextValue {
  show: (message: string, type?: ToastType, opts?: ToastOptions) => void;
  hide: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastData | null>(null);
  const [fadeAnim] = React.useState(() => new Animated.Value(0));
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
    });
  }, [fadeAnim]);

  const show = React.useCallback(
    (message: string, type: ToastType = 'info', opts?: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({
        message,
        type,
        actionLabel: opts?.actionLabel,
        onAction: opts?.onAction,
      });

      if (type === 'success') {
        void hapticFeedback.success();
      } else if (type === 'error') {
        void hapticFeedback.error();
      } else {
        void hapticFeedback.selection();
      }

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const duration = opts?.durationMs ?? (opts?.actionLabel ? 3000 : 2500);
      timerRef.current = setTimeout(() => {
        hide();
      }, duration);
    },
    [fadeAnim, hide]
  );

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && (
        <ToastHost
          message={toast.message}
          type={toast.type}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          opacity={fadeAnim}
          onDismiss={hide}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      hide: () => {},
    };
  }
  return ctx;
}

export function ToastHost({
  message,
  type,
  opacity,
  actionLabel,
  onAction,
  onDismiss,
}: {
  message: string;
  type: ToastType;
  opacity: Animated.Value;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}) {
  const insets = useSafeAreaInsets();

  const bg =
    type === 'success'
      ? '#00732E'
      : type === 'error'
      ? '#DC2626'
      : '#1F2937';

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: bg,
          opacity,
        },
      ]}
      pointerEvents={actionLabel ? 'box-none' : 'none'}
    >
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            onAction();
            onDismiss?.();
          }}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
