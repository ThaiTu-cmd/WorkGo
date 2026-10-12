import * as React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EntranceView } from '@/components/entrance-view';
import { HomeCategories } from '@/components/home-categories';
import { HomeExploreCard } from '@/components/home-explore-card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = [
  { id: '1', title: 'Thiết kế & Đồ họa', icon: '🎨', count: '124 việc' },
  { id: '2', title: 'Lập trình & Web', icon: '💻', count: '98 việc' },
  { id: '3', title: 'Viết lách & Dịch', icon: '✍️', count: '45 việc' },
  { id: '4', title: 'Kỹ thuật tại nhà', icon: '🔧', count: '76 việc' },
];

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Brand */}
          <EntranceView delay={0}>
            <View style={styles.header}>
              <View
                style={[
                  styles.brandBadge,
                  {
                    backgroundColor: theme.primarySubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText style={[styles.brandBadgeText, { color: theme.primary }]}>
                  WorkGo Mobile
                </ThemedText>
              </View>
              <ThemedText type="hero" style={styles.title}>
                Tìm việc & Thuê chuyên gia
              </ThemedText>
              <ThemedText style={styles.subtitle} themeColor="textSecondary">
                Nền tảng kết nối dịch vụ chuyên nghiệp, an toàn với ký quỹ Escrow
              </ThemedText>
            </View>
          </EntranceView>

          {/* System Status Card */}
          <EntranceView delay={80}>
            <ThemedView
              type="backgroundElement"
              style={[styles.statusCard, { borderColor: theme.border }]}
            >
              <View style={styles.statusDot} />
              <View style={styles.statusContent}>
                <ThemedText style={styles.statusTitle}>Hệ sinh thái WorkGo</ThemedText>
                <ThemedText style={styles.statusDesc} themeColor="textSecondary">
                  BFF Unified Proxy & Microservices sẵn sàng
                </ThemedText>
              </View>
            </ThemedView>
          </EntranceView>

          {/* Quick Categories */}
          <EntranceView delay={160}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Danh mục nổi bật
              </ThemedText>
            </View>
            <HomeCategories
              items={CATEGORIES}
              onSelectCategory={(cat) =>
                router.push({ pathname: '/catalog', params: { q: cat.title } })
              }
            />
          </EntranceView>

          {/* Featured Action Card */}
          <EntranceView delay={240}>
            <HomeExploreCard onCtaPress={() => router.push('/catalog')} />
          </EntranceView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  brandBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
