import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, colors, font, radius, spacing } from '@/ui';

// Green band under the status bar: greeting + a search box that opens Explore.
export function HomeHeader({ name }: { name: string | null }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.band, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.row}>
        {name ? (
          <View style={styles.flex}>
            <Text style={styles.hello}>Xin chào,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ) : (
          <View style={styles.flex}>
            <Text style={styles.name}>Chào bạn</Text>
            <Text style={styles.hello}>Tìm thợ, chuyên gia uy tín gần bạn</Text>
          </View>
        )}
        {name ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Tài khoản" onPress={() => router.push('/account')}>
            <View style={styles.avatarRing}>
              <Avatar name={name} size={38} />
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đăng nhập"
            onPress={() => router.push('/auth/login')}
            style={styles.signIn}>
            <Text style={styles.signInText}>Đăng nhập</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Tìm dịch vụ"
        onPress={() => router.push({ pathname: '/explore', params: { focus: '1', t: String(Date.now()) } })}
        style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <Text style={styles.searchText}>Bạn cần dịch vụ gì hôm nay?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.lg + 4,
    borderBottomRightRadius: radius.lg + 4,
    gap: spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  hello: { color: colors.white, fontSize: font.small + 1, opacity: 0.9 },
  name: { color: colors.white, fontSize: font.title + 2, fontWeight: '700' },
  avatarRing: { borderWidth: 2, borderColor: colors.white, borderRadius: 24 },
  signIn: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  signInText: { color: colors.primaryDark, fontWeight: '700', fontSize: font.small + 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md + 2,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  searchText: { color: colors.muted, fontSize: font.body },
});
