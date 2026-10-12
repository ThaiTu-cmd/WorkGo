import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressableScale } from '@/components/pressable-scale';
import { useAuth } from '@/store/auth';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();

  const [userName, setUserName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleLogin = async () => {
    if (!userName.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await login(userName.trim(), password);
      // Navigate to tabs or back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/catalog');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'messageVi' in err) {
        setErrorMsg((err as { messageVi: string }).messageVi);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top navigation / back */}
          <View style={styles.navRow}>
            <PressableScale
              style={[
                styles.backBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            >
              <ThemedText style={styles.backBtnText}>←</ThemedText>
            </PressableScale>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.brandBadge,
                { backgroundColor: theme.primarySubtle, borderColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.brandBadgeText, { color: theme.primary }]}>
                WorkGo Trust
              </ThemedText>
            </View>
            <ThemedText type="hero" style={styles.title}>
              Đăng nhập
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Truy cập tài khoản WorkGo để quản lý công việc và thanh toán Escrow
            </ThemedText>
          </View>

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{errorMsg}</ThemedText>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText style={styles.label}>Tên đăng nhập</ThemedText>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Mật khẩu</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            <PressableScale
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: submitting ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={submitting}
            >
              <ThemedText style={styles.submitBtnText}>
                {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
              </ThemedText>
            </PressableScale>
          </View>

          {/* Footer switch */}
          <View style={styles.footerSwitch}>
            <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
              Chưa có tài khoản?{' '}
            </ThemedText>
            <PressableScale onPress={() => router.push('/(auth)/register')}>
              <ThemedText style={[styles.switchLink, { color: theme.primary }]}>
                Đăng ký ngay
              </ThemedText>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.seven,
    paddingBottom: Spacing.six,
    justifyContent: 'center',
  },
  navRow: {
    marginBottom: Spacing.three,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  header: {
    marginBottom: Spacing.five,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Radius.control,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  submitBtn: {
    height: 48,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.five,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
