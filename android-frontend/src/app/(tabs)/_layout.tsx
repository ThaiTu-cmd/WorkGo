import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { colors } from '@/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primaryDark }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Khám phá', tabBarIcon: tabIcon('search-outline') }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng', tabBarIcon: tabIcon('receipt-outline') }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: tabIcon('person-outline') }} />
    </Tabs>
  );
}
