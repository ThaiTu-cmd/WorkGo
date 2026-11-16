import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useColors } from '@/ui';
import { useT } from '@/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const t = useT();
  const colors = useColors();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primaryDark }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.trang_chu'), tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: t('tabs.kham_pha'), tabBarIcon: tabIcon('search-outline') }} />
      <Tabs.Screen name="orders" options={{ title: t('tabs.don_hang'), tabBarIcon: tabIcon('receipt-outline') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.tai_khoan'), tabBarIcon: tabIcon('person-outline') }} />
    </Tabs>
  );
}
