import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { paymentApi } from '@/api/paymentApi';
import { qk } from '@/api/queryKeys';
import { PayoutSettingsScreen } from '../PayoutSettingsScreen';

jest.mock('@/auth/useRequireAuth', () => ({ useRequireAuth: () => true }));
jest.mock('@/api/paymentApi', () => ({ paymentApi: { getWallet: jest.fn(), requestPayout: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({ result: { balance: 1000000, outstandingFee: 0 } });
});

test('withdraws without a nonexistent saved settings API and reuses the key after a lost response', async () => {
  (paymentApi.requestPayout as jest.Mock).mockRejectedValue(new Error('Network request failed'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  await render(<QueryClientProvider client={client}><PayoutSettingsScreen /></QueryClientProvider>);
  await fireEvent.press(screen.getByText('Vietcombank'));
  await fireEvent.changeText(screen.getByPlaceholderText('NGUYEN VAN A'), 'NGUYEN VAN A');
  await fireEvent.changeText(screen.getByPlaceholderText('0071001234567'), '0071001234567');
  await fireEvent.changeText(screen.getByPlaceholderText('500000'), '100000');
  const button = () => screen.getByRole('button', { name: 'Tạo lệnh rút tiền' });
  await waitFor(() => expect(button()).not.toBeDisabled());
  await fireEvent.press(button());
  await waitFor(() => expect(paymentApi.requestPayout).toHaveBeenCalledTimes(1));
  expect(paymentApi.requestPayout).toHaveBeenCalledWith({ amount: 100000, bankCode: 'VCB', accountName: 'NGUYEN VAN A', accountNumber: '0071001234567' }, expect.any(String));
  await waitFor(() => expect(button()).not.toBeDisabled());
  await fireEvent.press(button());
  await waitFor(() => expect(paymentApi.requestPayout).toHaveBeenCalledTimes(2));
  expect((paymentApi.requestPayout as jest.Mock).mock.calls[1][1]).toBe((paymentApi.requestPayout as jest.Mock).mock.calls[0][1]);
  await waitFor(() => expect(button()).not.toBeDisabled());
});

test('accepts the backend minimum of 50000 VND', async () => {
  (paymentApi.getWallet as jest.Mock).mockResolvedValue({ result: { balance: 50000, outstandingFee: 0 } });
  (paymentApi.requestPayout as jest.Mock).mockResolvedValue({ result: { payoutId: 'p1', status: 'REQUESTED' } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  await render(<QueryClientProvider client={client}><PayoutSettingsScreen /></QueryClientProvider>);
  await fireEvent.press(screen.getByText('Vietcombank'));
  await fireEvent.changeText(screen.getByPlaceholderText('NGUYEN VAN A'), 'NGUYEN VAN A');
  await fireEvent.changeText(screen.getByPlaceholderText('0071001234567'), '0071001234567');
  await fireEvent.changeText(screen.getByPlaceholderText('500000'), '50000');
  const button = () => screen.getByRole('button', { name: 'Tạo lệnh rút tiền' });
  await waitFor(() => expect(button()).not.toBeDisabled());
  await fireEvent.press(button());
  await waitFor(() => expect(paymentApi.requestPayout).toHaveBeenCalledWith(expect.objectContaining({ amount: 50000 }), expect.any(String)));
  await waitFor(() => expect(screen.getByPlaceholderText('500000')).toHaveDisplayValue(''));
});

test('rejects an account number typo instead of silently choosing another destination', async () => {
  (paymentApi.requestPayout as jest.Mock).mockResolvedValue({ result: { payoutId: 'p1' } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  await render(<QueryClientProvider client={client}><PayoutSettingsScreen /></QueryClientProvider>);
  await fireEvent.press(screen.getByText('Vietcombank'));
  await fireEvent.changeText(screen.getByPlaceholderText('NGUYEN VAN A'), 'NGUYEN VAN A');
  await fireEvent.changeText(screen.getByPlaceholderText('0071001234567'), '0071001234567x');
  await fireEvent.changeText(screen.getByPlaceholderText('500000'), '100000');
  await fireEvent.press(screen.getByRole('button', { name: 'Tạo lệnh rút tiền' }));
  expect(await screen.findByText('Số tài khoản phải gồm 8-19 chữ số')).toBeTruthy();
  expect(paymentApi.requestPayout).not.toHaveBeenCalled();
});

test('replays an ambiguous payout after refreshed funds change, while a new payload still requires funds', async () => {
  (paymentApi.requestPayout as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'))
    .mockResolvedValueOnce({ result: { payoutId: 'p1', status: 'REQUESTED' } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  await render(<QueryClientProvider client={client}><PayoutSettingsScreen /></QueryClientProvider>);
  await fireEvent.press(screen.getByText('Vietcombank'));
  await fireEvent.changeText(screen.getByPlaceholderText('NGUYEN VAN A'), 'NGUYEN VAN A');
  await fireEvent.changeText(screen.getByPlaceholderText('0071001234567'), '0071001234567');
  await fireEvent.changeText(screen.getByPlaceholderText('500000'), '100000');
  const button = () => screen.getByRole('button', { name: 'Tạo lệnh rút tiền' });
  await waitFor(() => expect(button()).not.toBeDisabled());
  await fireEvent.press(button());
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Lỗi', 'Network request failed'));
  const original = (paymentApi.requestPayout as jest.Mock).mock.calls[0];
  await act(async () => { client.setQueryData(qk.wallet(), { balance: 0, outstandingFee: 30000 }); });
  await waitFor(() => expect(button()).not.toBeDisabled());
  await fireEvent.changeText(screen.getByPlaceholderText('500000'), '200000');
  expect(button()).toBeDisabled();
  await fireEvent.press(button());
  expect(paymentApi.requestPayout).toHaveBeenCalledTimes(1);
  await fireEvent.changeText(screen.getByPlaceholderText('500000'), '100000');
  await waitFor(() => expect(button()).not.toBeDisabled());
  await fireEvent.press(button());
  await waitFor(() => expect(paymentApi.requestPayout).toHaveBeenCalledTimes(2));
  expect((paymentApi.requestPayout as jest.Mock).mock.calls[1]).toEqual(original);
  await waitFor(() => expect(screen.getByPlaceholderText('500000')).toHaveDisplayValue(''));
});
