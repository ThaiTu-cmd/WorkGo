import { Text } from 'react-native';

import { font, Screen } from '@/ui';

// Filled in by the catalog task.
export default function HomeTab() {
  return (
    <Screen>
      <Text style={{ fontSize: font.hero, fontWeight: '700' }}>WorkGo</Text>
    </Screen>
  );
}
