import * as React from 'react';
import { StyleSheet, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticFeedback } from '@/utils/haptics';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<{ message: string; type: ToastType } | null>(null);
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
    (message: string, type: ToastType = 'info') => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast({ message, type });

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

      timerRef.current = setTimeout(() => {
        hide();
      }, 2500);
    },
    [fadeAnim, hide]
  );

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && <ToastHost message={toast.message} type={toast.type} opacity={fadeAnim} />}
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
}: {
  message: string;
  type: ToastType;
  opacity: Animated.Value;
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
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
