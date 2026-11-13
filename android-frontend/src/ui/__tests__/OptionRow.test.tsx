import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { OptionRow } from '../OptionRow';
import { darkColors, lightColors } from '../theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));
const useColorScheme = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default as jest.Mock;

const rowStyle = () => StyleSheet.flatten(screen.getByRole('radio', { name: '08:00' }).props.style);

// Slot, add-on and address rows sit on the dark screen background: a white
// row would put the light dark-mode text on white.
test('dark mode row uses the dark card surface', async () => {
  useColorScheme.mockReturnValue('dark');
  await render(<OptionRow label="08:00" kind="radio" selected={false} onPress={jest.fn()} />);
  expect(rowStyle().backgroundColor).toBe(darkColors.card);
  expect(StyleSheet.flatten(screen.getByText('08:00').props.style).color).toBe(darkColors.text);
});

test('light mode row stays white', async () => {
  useColorScheme.mockReturnValue('light');
  await render(<OptionRow label="08:00" kind="radio" selected={false} onPress={jest.fn()} />);
  expect(rowStyle().backgroundColor).toBe(lightColors.card);
  expect(StyleSheet.flatten(screen.getByText('08:00').props.style).color).toBe(lightColors.text);
});
