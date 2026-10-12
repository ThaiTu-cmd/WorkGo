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
import { authApi } from '@/api/auth';
import { useAuth } from '@/store/auth';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const { login } = useAuth();

  const [userName, setUserName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleRegister = async () => {
    if (!userName.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (userName.trim().length < 3) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ họ và tên');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await authApi.register({
        userName: userName.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      // Auto login upon successful registration
      await login(userName.trim(), password);

      router.replace('/(tabs)/catalog');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'messageVi' in err) {
        setErrorMsg((err as { messageVi: string }).messageVi);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã tồn tại.');
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
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
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
                Tạo tài khoản mới
              </ThemedText>
            </View>
            <ThemedText type="hero" style={styles.title}>
              Đăng ký
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Trở thành thành viên mạng lưới việc làm chuyên nghiệp WorkGo
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
            <View style={styles.nameRow}>
              <View style={[styles.field, styles.halfField]}>
                <ThemedText style={styles.label}>Họ</ThemedText>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nguyễn"
                  placeholderTextColor={theme.textSecondary}
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
              <View style={[styles.field, styles.halfField]}>
                <ThemedText style={styles.label}>Tên</ThemedText>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Văn A"
                  placeholderTextColor={theme.textSecondary}
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
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Tên đăng nhập</ThemedText>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="nguyenvana"
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
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vana@example.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
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
              <ThemedText style={styles.label}>Số điện thoại (tùy chọn)</ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="0912345678"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
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
                placeholder="Tối thiểu 6 ký tự"
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
              onPress={handleRegister}
              disabled={submitting}
            >
              <ThemedText style={styles.submitBtnText}>
                {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
              </ThemedText>
            </PressableScale>
          </View>

          {/* Footer switch */}
          <View style={styles.footerSwitch}>
            <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
              Đã có tài khoản?{' '}
            </ThemedText>
            <PressableScale onPress={() => router.push('/(auth)/login')}>
              <ThemedText style={[styles.switchLink, { color: theme.primary }]}>
                Đăng nhập
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
    marginBottom: Spacing.four,
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
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  halfField: {
    flex: 1,
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
