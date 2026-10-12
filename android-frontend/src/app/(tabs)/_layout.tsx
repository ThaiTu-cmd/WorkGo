import React from 'react';
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store/auth';

export default function TabLayout() {
  const theme = useTheme();
  const { session } = useAuth();

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
        name="saved"
        options={{
          title: 'Đã lưu',
          tabBarLabel: 'Đã lưu',
        }}
      />
      <Tabs.Screen
        name="my-posts"
        options={{
          title: 'Tin của tôi',
          tabBarLabel: 'Tin của tôi',
          href: session ? '/(tabs)/my-posts' : null,
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
