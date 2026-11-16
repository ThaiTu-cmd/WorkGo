import { Text } from 'react-native';

import { useT, type Language, type MessageKey } from '@/i18n';
import { setLanguagePreference, setThemePreference, usePreferences, type ThemePreference } from '@/settings/preferences';
import { Card, font, makeStyles, OptionRow, Screen } from '@/ui';

const THEMES: { value: ThemePreference; label: MessageKey }[] = [
  { value: 'system', label: 'settings.theme_system' },
  { value: 'light', label: 'settings.theme_light' },
  { value: 'dark', label: 'settings.theme_dark' },
];

// Language names stay in their own language so either can be found.
const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

export function SettingsScreen() {
  const styles = useStyles();
  const t = useT();
  const { theme, language } = usePreferences();
  return (
    <Screen edges={[]}>
      <Card>
        <Text style={styles.section}>{t('settings.appearance')}</Text>
        {THEMES.map((option) => (
          <OptionRow
            key={option.value}
            kind="radio"
            label={t(option.label)}
            selected={theme === option.value}
            onPress={() => void setThemePreference(option.value)}
          />
        ))}
      </Card>
      <Card>
        <Text style={styles.section}>{t('settings.language')}</Text>
        {LANGUAGES.map((option) => (
          <OptionRow
            key={option.value}
            kind="radio"
            label={option.label}
            selected={language === option.value}
            onPress={() => void setLanguagePreference(option.value)}
          />
        ))}
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  section: { fontSize: font.body, fontWeight: '700', color: colors.text },
}));
