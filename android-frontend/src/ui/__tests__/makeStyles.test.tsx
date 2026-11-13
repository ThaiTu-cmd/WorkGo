import { render, renderHook, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ErrorState } from '../States';
import { darkColors, lightColors, makeStyles } from '../theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: jest.fn() }));
const useColorScheme = jest.requireMock('react-native/Libraries/Utilities/useColorScheme').default as jest.Mock;

const useStyles = makeStyles((colors) => ({ title: { color: colors.text } }));

test('styles follow the color scheme while the app is open', async () => {
  useColorScheme.mockReturnValue('light');
  const { result, rerender } = await renderHook(() => useStyles());
  expect(result.current.title.color).toBe(lightColors.text);
  useColorScheme.mockReturnValue('dark');
  await rerender({});
  expect(result.current.title.color).toBe(darkColors.text);
});

test('styles are built once per scheme', async () => {
  useColorScheme.mockReturnValue('dark');
  const { result, rerender } = await renderHook(() => useStyles());
  const first = result.current;
  await rerender({});
  expect(result.current).toBe(first);
});

// Switching Android to dark mode with the app open must recolour screens
// that were first drawn in light mode.
test('a screen drawn in light mode turns dark after the switch', async () => {
  useColorScheme.mockReturnValue('light');
  const view = await render(<ErrorState message="Mất kết nối" />);
  const titleColor = () => StyleSheet.flatten(screen.getByText('Không tải được dữ liệu').props.style).color;
  expect(titleColor()).toBe(lightColors.text);
  useColorScheme.mockReturnValue('dark');
  await view.rerender(<ErrorState message="Mất kết nối" />);
  expect(titleColor()).toBe(darkColors.text);
});
