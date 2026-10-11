import * as React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PressableScale } from "@/components/pressable-scale";
import { MaxContentWidth, Spacing, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface CategoryItem {
  id: string;
  title: string;
  icon: string;
  count: string;
}

export interface HomeCategoriesProps {
  items: CategoryItem[];
  onSelectCategory?: (item: CategoryItem) => void;
}

export function HomeCategories({ items, onSelectCategory }: HomeCategoriesProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {items.map((cat) => (
        <PressableScale
          key={cat.id}
          style={styles.cardWrapper}
          onPress={() => onSelectCategory?.(cat)}
        >
          <ThemedView
            type="backgroundElement"
            style={[
              styles.card,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <ThemedText style={styles.icon}>{cat.icon}</ThemedText>
            <ThemedText style={styles.name}>{cat.title}</ThemedText>
            <ThemedText style={[styles.count, { color: theme.textSecondary }]}>
              {cat.count}
            </ThemedText>
          </ThemedView>
        </PressableScale>
      ))}
    </View>
  );
}

const maxCardWidth = Math.floor((MaxContentWidth - 56) / 2);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  cardWrapper: {
    width: "48%",
    maxWidth: maxCardWidth,
  },
  card: {
    width: "100%",
    padding: Spacing.three,
    borderRadius: Radius.control ?? 12,
    borderWidth: 1,
    gap: Spacing.half,
    alignItems: "flex-start",
  },
  icon: {
    fontSize: 24,
    marginBottom: Spacing.half,
    textAlign: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  count: {
    fontSize: 12,
  },
});
