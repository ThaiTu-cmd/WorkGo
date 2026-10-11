import * as React from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PressableScale } from "@/components/pressable-scale";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radius } from "@/constants/theme";

export interface HomeExploreCardProps {
  title?: string;
  desc?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function HomeExploreCard({
  title = "Bảo chứng thanh toán Escrow",
  desc = "Tiền của bạn được giữ an toàn trong ví đảm bảo cho tới khi công việc hoàn tất và được nghiệm thu hài lòng 100%.",
  ctaLabel = "Khám phá việc làm",
  onCtaPress,
}: HomeExploreCardProps) {
  const scheme = useColorScheme();
  const theme = useTheme();
  const isDark = scheme === "dark";

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: isDark ? theme.surface : "#EFF6FF",
          borderColor: isDark ? theme.border : "#BFDBFE",
        },
      ]}
    >
      <ThemedText
        style={[
          styles.title,
          { color: isDark ? theme.primary : "#1E40AF" },
        ]}
      >
        {title}
      </ThemedText>
      <ThemedText
        style={[
          styles.desc,
          { color: isDark ? theme.textSecondary : "#1E3A8A" },
        ]}
      >
        {desc}
      </ThemedText>
      <PressableScale
        style={[styles.ctaButton, { backgroundColor: theme.primary }]}
        onPress={onCtaPress}
      >
        <ThemedText style={styles.ctaButtonText}>{ctaLabel}</ThemedText>
      </PressableScale>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.card ?? 18,
    borderWidth: 1,
    gap: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  ctaButton: {
    marginTop: Spacing.two,
    height: 48,
    borderRadius: Radius.control ?? 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
