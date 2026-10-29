import { Text } from 'react-native';

import { font, Screen } from '@/ui';

// Filled in by the catalog task.
export default function ExploreTab() {
  return (
    <Screen>
      <Text style={{ fontSize: font.hero, fontWeight: '700' }}>Khám phá</Text>
    </Screen>
  );
}
