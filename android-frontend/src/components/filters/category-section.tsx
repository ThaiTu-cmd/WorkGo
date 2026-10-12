import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/pressable-scale';
import { type MobileCategory } from '@/api/catalog';
import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface CategorySectionProps {
  categories: MobileCategory[];
  selectedCategory?: string;
  onSelectCategory: (id?: string) => void;
}

export function CategorySection({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySectionProps) {
  const theme = useTheme();

  if (categories.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Danh mục</ThemedText>
      <View style={styles.chipGrid}>
        <PressableScale
          style={[
            styles.chip,
            {
              backgroundColor: !selectedCategory ? theme.primary : theme.backgroundElement,
              borderColor: !selectedCategory ? theme.primary : theme.border,
            },
          ]}
          onPress={() => onSelectCategory(undefined)}
        >
          <ThemedText
            style={[
              styles.chipText,
              { color: !selectedCategory ? '#FFFFFF' : theme.text },
            ]}
          >
            Tất cả danh mục
          </ThemedText>
        </PressableScale>
        {categories.map((c) => {
          const isSelected = selectedCategory === c.id;
          return (
            <PressableScale
              key={c.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => onSelectCategory(c.id)}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : theme.text },
                ]}
              >
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </ThemedText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
