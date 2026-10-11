import * as React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { PressableScale } from '@/components/pressable-scale';
import { EntranceView } from '@/components/entrance-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.seven,
      paddingBottom: Spacing.four,
    },
    default: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <EntranceView delay={0}>
          <ThemedView style={styles.titleContainer}>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>WorkGo Ecosystem</ThemedText>
            </View>
            <ThemedText type="hero" style={styles.centerTitle}>
              Khám phá WorkGo
            </ThemedText>
            <ThemedText style={styles.centerText} themeColor="textSecondary">
              Nền tảng kết nối chuyên gia, việc làm freelance và thanh toán Escrow bảo chứng an toàn.
            </ThemedText>
          </ThemedView>
        </EntranceView>

        <EntranceView delay={100}>
          <ThemedView style={styles.sectionsWrapper}>
            <Collapsible title="Tìm việc & Thuê chuyên gia">
              <ThemedText type="small">
                WorkGo cung cấp hàng nghìn cơ hội việc làm freelance và kết nối với các chuyên gia
                hàng đầu trong các lĩnh vực Thiết kế, Lập trình, Viết lách và Kỹ thuật số.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tipText}>
                Hệ thống đề xuất thông minh giúp khớp lệnh nhanh chóng giữa nhà tuyển dụng và ứng viên.
              </ThemedText>
            </Collapsible>

            <Collapsible title="Bảo chứng thanh toán Escrow">
              <ThemedText type="small">
                Mọi giao dịch trên WorkGo đều được bảo vệ bởi cơ chế Ký quỹ Escrow. Tiền thù lao
                được giữ an toàn tại tài khoản trung gian và chỉ giải ngân khi công việc được nghiệm thu
                hài lòng 100%.
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tipText}>
                Chính sách minh bạch, bảo vệ tối đa quyền lợi của cả người thuê và người làm việc.
              </ThemedText>
            </Collapsible>

            <Collapsible title="Bắt đầu trong 3 bước">
              <ThemedText type="small">
                1. Đăng tin tuyển dụng hoặc tạo hồ sơ chuyên gia miễn phí.
              </ThemedText>
              <ThemedText type="small">
                2. Trao đổi, thương lượng phạm vi công việc và nạp tiền ký quỹ Escrow an toàn.
              </ThemedText>
              <ThemedText type="small">
                3. Nghiệm thu sản phẩm, giải ngân thanh toán và đánh giá uy tín đôi bên.
              </ThemedText>
            </Collapsible>
          </ThemedView>
        </EntranceView>

        <EntranceView delay={200}>
          <ThemedView
            style={[
              styles.ctaCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText style={styles.ctaTitle}>Sẵn sàng bắt đầu dự án?</ThemedText>
            <ThemedText style={styles.ctaDesc} themeColor="textSecondary">
              Đăng tin công việc ngay hôm nay để nhận báo giá từ các chuyên gia phù hợp nhất.
            </ThemedText>
            <PressableScale
              style={[styles.ctaButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.ctaButtonText}>Đăng việc ngay</ThemedText>
            </PressableScale>
          </ThemedView>
        </EntranceView>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  titleContainer: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.control ?? 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 480,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionsWrapper: {
    gap: Spacing.three,
  },
  tipText: {
    marginTop: Spacing.one,
    fontStyle: 'italic',
  },
  ctaCard: {
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.card ?? 18,
    borderWidth: 1,
    gap: Spacing.two,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  ctaDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 420,
  },
  ctaButton: {
    marginTop: Spacing.one,
    height: 48,
    width: '100%',
    maxWidth: 280,
    borderRadius: Radius.control ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
