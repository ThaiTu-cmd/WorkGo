import { Text } from 'react-native';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { font, Screen } from '@/ui';

// Filled in by the orders task.
export default function OrdersTab() {
  const signedIn = useRequireAuth();
  if (!signedIn) return null;
  return (
    <Screen>
      <Text style={{ fontSize: font.hero, fontWeight: '700' }}>Đơn hàng</Text>
    </Screen>
  );
}
