import { Text, View } from 'react-native';

import type { ServiceCard } from '@/api/adapters';
import { formatVnd } from '@/lib/format';
import { Avatar, Badge, Card, font, makeStyles, spacing } from '@/ui';
import { translate, useT } from '@/i18n';

export const EXECUTION_LABEL = { DIGITAL: 'Online', get ONSITE() {
    return translate('serviceCardView.tai_nha');
  } } as const;

export function ServiceCardView({ service, onPress }: { service: ServiceCard; onPress: () => void }) {
  const t = useT();
  const styles = useStyles();
  return (
    <Card onPress={onPress} accessibilityLabel={service.title}>
      <View style={styles.row}>
        <Badge label={EXECUTION_LABEL[service.executionType]} tone={service.executionType === 'ONSITE' ? 'info' : 'success'} />
        {service.categoryName ? <Text style={styles.muted}>{service.categoryName}</Text> : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {service.title}
      </Text>
      <View style={styles.row}>
        <Avatar name={service.provider.name} size={24} />
        <Text style={styles.muted} numberOfLines={1}>
          {service.provider.name}
        </Text>
      </View>
      <Text style={styles.price}>{t('serviceCardView.tu', { p0: formatVnd(service.basePrice) })}</Text>
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: font.title - 2, fontWeight: '700', color: colors.text },
  muted: { fontSize: font.small, color: colors.muted, flexShrink: 1 },
  price: { fontSize: font.body, fontWeight: '700', color: colors.primaryDark },
}));
