import React from 'react';
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Khám phá',
          tabBarLabel: 'Việc làm',
        }}
      />
      <Tabs.Screen
        name="detail"
        options={{
          href: null,
          title: 'Chi tiết việc',
        }}
      />
    </Tabs>
  );
}
