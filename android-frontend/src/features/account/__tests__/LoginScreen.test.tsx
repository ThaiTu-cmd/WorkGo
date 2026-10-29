import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError, UNREACHABLE_MESSAGE } from '@/api/errors';
import { useAuth } from '@/auth/AuthProvider';

import { LoginScreen } from '../LoginScreen';

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => mockParams,
    // The real Link renders a Text.
    Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock('@/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
const signIn = jest.fn();
(useAuth as jest.Mock).mockReturnValue({ signIn, status: 'guest' });

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

async function fill(user: string, pass: string) {
  await fireEvent.changeText(screen.getByLabelText('Tên đăng nhập'), user);
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu'), pass);
}

test('shows field errors when username/password empty', async () => {
  await render(<LoginScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByText('Vui lòng nhập tên đăng nhập')).toBeTruthy();
  expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeTruthy();
  expect(signIn).not.toHaveBeenCalled();
});

test('maps 401 to "Sai tên đăng nhập hoặc mật khẩu." and keeps form', async () => {
  signIn.mockRejectedValueOnce(new ApiError(401, { code: 1006, message: 'Unauthenticated' }));
  await render(<LoginScreen />);
  await fill('an', 'wrong');
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByText('Sai tên đăng nhập hoặc mật khẩu.')).toBeTruthy();
  expect(screen.getByLabelText('Tên đăng nhập').props.value).toBe('an');
  expect(mockReplace).not.toHaveBeenCalled();
});

test('shows UNREACHABLE_MESSAGE when backend is down', async () => {
  signIn.mockRejectedValueOnce(new ApiError(0, null));
  await render(<LoginScreen />);
  await fill('an', 'pw');
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByText(UNREACHABLE_MESSAGE)).toBeTruthy();
});

test('on success replaces to redirect param', async () => {
  mockParams = { redirect: '/orders' };
  signIn.mockResolvedValueOnce(undefined);
  await render(<LoginScreen />);
  await fill('an', 'pw');
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/orders'));
  expect(signIn).toHaveBeenCalledWith('an', 'pw');
});

test('ignores a redirect that is not an in-app path', async () => {
  mockParams = { redirect: 'https://evil.example' };
  signIn.mockResolvedValueOnce(undefined);
  await render(<LoginScreen />);
  await fill('an', 'pw');
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
});
