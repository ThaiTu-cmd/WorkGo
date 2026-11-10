import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../Button';

// Forms pass loading={isSubmitting}; this is what stops a double tap from
// submitting twice (login, checkout, evidence upload).
test('loading button is disabled and ignores presses', async () => {
  const onPress = jest.fn();
  await render(<Button title="Đặt dịch vụ" loading onPress={onPress} />);
  const button = screen.getByRole('button', { name: 'Đặt dịch vụ' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('enabled button calls onPress', async () => {
  const onPress = jest.fn();
  await render(<Button title="Lưu" onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Lưu' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
