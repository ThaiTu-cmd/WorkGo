import * as React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '@/constants/theme';

const CATEGORIES = [
  { id: '1', title: 'Thiết kế & Đồ họa', icon: '🎨', count: '124 việc' },
  { id: '2', title: 'Lập trình & Web', icon: '💻', count: '98 việc' },
  { id: '3', title: 'Viết lách & Dịch', icon: '✍️', count: '45 việc' },
  { id: '4', title: 'Kỹ thuật tại nhà', icon: '🔧', count: '76 việc' },
];

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Brand */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <ThemedText style={styles.brandBadgeText}>WorkGo Mobile</ThemedText>
            </View>
            <ThemedText type="title" style={styles.title}>
              Tìm việc & Thuê chuyên gia
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Nền tảng kết nối dịch vụ chuyên nghiệp, an toàn với ký quỹ Escrow
            </ThemedText>
          </View>

          {/* System Status Card */}
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <View style={styles.statusDot} />
            <View style={styles.statusContent}>
              <ThemedText style={styles.statusTitle}>Hệ sinh thái WorkGo</ThemedText>
              <ThemedText style={styles.statusDesc}>
                BFF Unified Proxy & Microservices sẵn sàng
              </ThemedText>
            </View>
          </ThemedView>

          {/* Quick Categories */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Danh mục nổi bật
            </ThemedText>
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <ThemedView key={cat.id} type="backgroundElement" style={styles.categoryCard}>
                <ThemedText style={styles.categoryIcon}>{cat.icon}</ThemedText>
                <ThemedText style={styles.categoryName}>{cat.title}</ThemedText>
                <ThemedText style={styles.categoryCount}>{cat.count}</ThemedText>
              </ThemedView>
            ))}
          </View>

          {/* Featured Action Card */}
          <ThemedView type="backgroundElement" style={styles.featureCard}>
            <ThemedText type="subtitle" style={styles.featureTitle}>
              Bảo chứng thanh toán Escrow
            </ThemedText>
            <ThemedText style={styles.featureDesc}>
              Tiền của bạn được giữ an toàn trong ví đảm bảo cho tới khi công việc hoàn tất và được nghiệm thu hài lòng 100%.
            </ThemedText>
            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
              <ThemedText style={styles.ctaButtonText}>Khám phá việc làm</ThemedText>
            </TouchableOpacity>
          </ThemedView>
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  brandBadgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    color: Colors.light.text,
  },
  statusDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    width: '48%',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.half,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.half,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  featureCard: {
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    gap: Spacing.two,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  featureDesc: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  ctaButton: {
    marginTop: Spacing.two,
    backgroundColor: '#2563EB',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
