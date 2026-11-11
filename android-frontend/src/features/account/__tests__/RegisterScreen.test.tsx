import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { authApi } from '@/api/authApi';
import { useAuth } from '@/auth/AuthProvider';

import { RegisterScreen } from '../RegisterScreen';

const mockRouter = { replace: jest.fn(), dismiss: jest.fn(), canDismiss: jest.fn(() => true), push: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/api/authApi', () => ({ authApi: { register: jest.fn(async () => ({})) } }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
const signIn = jest.fn(async () => {});
(useAuth as jest.Mock).mockReturnValue({ signIn });

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

async function submitValidForm() {
  await render(<RegisterScreen />);
  const values: Record<string, string> = {
    'Họ và tên': 'Nguyễn Văn An',
    'Tên đăng nhập': 'an01',
    Email: 'an@example.com',
    'Số điện thoại': '0901234567',
    'Mật khẩu': 'matkhau123',
    'Nhập lại mật khẩu': 'matkhau123',
  };
  for (const [label, value] of Object.entries(values)) await fireEvent.changeText(screen.getByLabelText(label), value);
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng ký' }));
}

test('registers with split name, signs in, and closes register + the login under it', async () => {
  mockParams = { viaLogin: '1' };
  await submitValidForm();
  await waitFor(() => expect(mockRouter.dismiss).toHaveBeenCalledWith(2));
  expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'An', lastName: 'Nguyễn Văn', userName: 'an01' }));
  expect(signIn).toHaveBeenCalledWith('an01', 'matkhau123');
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test('opened directly (from Account) closes only itself', async () => {
  await submitValidForm();
  await waitFor(() => expect(mockRouter.dismiss).toHaveBeenCalledWith(1));
});

test('with a redirect, pops the login under it and turns into the destination', async () => {
  mockParams = { viaLogin: '1', redirect: '/checkout?serviceId=s1' };
  await submitValidForm();
  await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/checkout?serviceId=s1'));
  expect(mockRouter.dismiss).toHaveBeenCalledWith(1);
});
