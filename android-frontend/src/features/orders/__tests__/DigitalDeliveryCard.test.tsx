import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { getDocumentAsync } from 'expo-document-picker';
import { Directory } from 'expo-file-system';
import { fetch } from 'expo/fetch';

import { orderApi } from '@/api/orderApi';
import type { OrderDto } from '@/api/types';

import { DigitalDeliveryCard } from '../DigitalDeliveryCard';

const mockOutput = { writableStream: jest.fn(() => 'output-stream'), delete: jest.fn() };
const mockDirectory = { createFile: jest.fn(() => mockOutput) };
const mockPipeTo = jest.fn();
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ Directory: { pickDirectoryAsync: jest.fn() } }));
jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ token: 'token1' }) }));
jest.mock('@/api/orderApi', () => ({
  orderApi: {
    getDeliveries: jest.fn(), uploadFile: jest.fn(), submitDelivery: jest.fn(), getDownloadUrl: jest.fn(),
    getOrder: jest.fn(), getRevisions: jest.fn(), submitRequirements: jest.fn(), acceptDelivery: jest.fn(), requestRevision: jest.fn(),
  },
}));
const order: OrderDto = { orderId: 'o1', serviceId: 's1', title: 'Logo', orderStatus: 'IN_PROGRESS', executionType: 'DIGITAL' };
const delivery = {
  deliveryPackageId: 'd1', versionNo: 1, deliveredAt: '2026-11-18T10:00:00Z',
  files: [{ deliveryFileId: 'df1', storedFileId: 'file1', fileName: 'logo.pdf', mimeType: 'application/pdf' }],
};

function renderCard(role: 'CLIENT' | 'PROVIDER' = 'PROVIDER', orderStatus: OrderDto['orderStatus'] = 'IN_PROGRESS', execution = { status: 'WORKING', revisionLimit: null as number | null, revisionsUsed: 0 }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <DigitalDeliveryCard order={{ ...order, orderStatus }} role={role} execution={execution} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (orderApi.getDeliveries as jest.Mock).mockResolvedValue({ result: [] });
  (orderApi.getOrder as jest.Mock).mockResolvedValue({ result: { snapshot: { requirementValues: { description: 'Logo từ dữ liệu đã lưu', references: [] } } } });
  (orderApi.getRevisions as jest.Mock).mockResolvedValue({ result: [{ revisionRequestId: 'rev1', reason: 'Sửa màu theo brief', status: 'OPEN', createdAt: '2026-11-18T10:00:00Z' }] });
  (orderApi.submitRequirements as jest.Mock).mockResolvedValue({});
  (orderApi.acceptDelivery as jest.Mock).mockResolvedValue({ result: { status: 'ACCEPT' } });
  (orderApi.requestRevision as jest.Mock).mockResolvedValue({ result: { revisionRequestId: 'rev2' } });
  (getDocumentAsync as jest.Mock).mockResolvedValue({
    canceled: false, assets: [{ uri: 'file:///logo.pdf', name: 'logo.pdf', mimeType: 'application/pdf', size: 5000 }],
  });
  (orderApi.uploadFile as jest.Mock).mockResolvedValue({ result: { storedFileId: 'file1' } });
  (orderApi.submitDelivery as jest.Mock).mockResolvedValue({ result: delivery });
  (Directory.pickDirectoryAsync as jest.Mock).mockResolvedValue(mockDirectory);
  (orderApi.getDownloadUrl as jest.Mock).mockResolvedValue({ result: { url: '/orders/files/file1/content?expires=123&signature=abc' } });
  (fetch as jest.Mock).mockResolvedValue({ ok: true, body: { pipeTo: mockPipeTo } });
  mockPipeTo.mockResolvedValue(undefined);
});

test('confirmed client sends its brief using the requirement values contract', async () => {
  await renderCard('CLIENT', 'CONFIRMED', { status: 'AWAITING_REQUIREMENTS', revisionLimit: null, revisionsUsed: 0 });
  await fireEvent.changeText(await screen.findByLabelText('Mô tả yêu cầu'), '  Thiết kế logo xanh  ');
  await fireEvent.changeText(screen.getByLabelText('Liên kết tham khảo, mỗi dòng một liên kết'), 'https://example.com/reference');
  await fireEvent.press(screen.getByRole('button', { name: 'Gửi yêu cầu đầu vào' }));
  await waitFor(() => expect(orderApi.submitRequirements).toHaveBeenCalledWith('o1', {
    description: 'Thiết kế logo xanh', references: ['https://example.com/reference'],
  }));
});

test('requirements form prevents empty brief and unsupported reference URLs', async () => {
  await renderCard('CLIENT', 'CONFIRMED', { status: 'AWAITING_REQUIREMENTS', revisionLimit: null, revisionsUsed: 0 });
  expect(await screen.findByRole('button', { name: 'Gửi yêu cầu đầu vào' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Mô tả yêu cầu'), 'Logo');
  await fireEvent.changeText(screen.getByLabelText('Liên kết tham khảo, mỗi dòng một liên kết'), 'javascript:alert(1)');
  expect(screen.getByRole('button', { name: 'Gửi yêu cầu đầu vào' })).toBeDisabled();
  expect(orderApi.submitRequirements).not.toHaveBeenCalled();
});

test('delivered client accepts the latest submitted delivery using server state', async () => {
  (orderApi.getDeliveries as jest.Mock).mockResolvedValue({ result: [{ ...delivery, status: 'SUBMITTED' }] });
  await renderCard('CLIENT', 'DELIVERED', { status: 'SUBMITTED', revisionLimit: null, revisionsUsed: 3 });
  await fireEvent.press(await screen.findByRole('button', { name: 'Nghiệm thu bàn giao' }));
  await waitFor(() => expect(orderApi.acceptDelivery).toHaveBeenCalledWith('o1'));
});

test('client can request an in-scope revision without inventing a limit', async () => {
  (orderApi.getDeliveries as jest.Mock).mockResolvedValue({ result: [{ ...delivery, status: 'SUBMITTED' }] });
  await renderCard('CLIENT', 'DELIVERED', { status: 'SUBMITTED', revisionLimit: null, revisionsUsed: 3 });
  await fireEvent.changeText(await screen.findByLabelText('Nội dung cần sửa trong phạm vi'), '  Điều chỉnh màu theo yêu cầu đã gửi  ');
  await fireEvent.press(screen.getByRole('button', { name: 'Yêu cầu chỉnh sửa' }));
  await waitFor(() => expect(orderApi.requestRevision).toHaveBeenCalledWith('o1', 'Điều chỉnh màu theo yêu cầu đã gửi'));
});

test('revision requests respect a stored limit while keeping acceptance available', async () => {
  (orderApi.getDeliveries as jest.Mock).mockResolvedValue({ result: [{ ...delivery, status: 'SUBMITTED' }] });
  await renderCard('CLIENT', 'DELIVERED', { status: 'SUBMITTED', revisionLimit: 2, revisionsUsed: 2 });
  expect(await screen.findByRole('button', { name: 'Nghiệm thu bàn giao' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Yêu cầu chỉnh sửa' })).toBeNull();
});

test('provider reads the persisted brief and latest revision without client response controls', async () => {
  await renderCard('PROVIDER');
  expect(await screen.findByText('Logo từ dữ liệu đã lưu')).toBeTruthy();
  expect(await screen.findByText('Sửa màu theo brief')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Nghiệm thu bàn giao' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Gửi yêu cầu đầu vào' })).toBeNull();
});

test('legacy structured requirement values do not crash the workspace', async () => {
  (orderApi.getOrder as jest.Mock).mockResolvedValue({ result: { snapshot: { requirementValues: { description: { text: 'custom' }, references: ['https://example.com/reference', { extra: true }] } } } });
  await renderCard('PROVIDER');
  expect(await screen.findByText('https://example.com/reference')).toBeTruthy();
});

test('provider uploads the chosen file and submits its stored file ID, then refreshes delivery versions', async () => {
  await renderCard();
  await fireEvent.press(await screen.findByRole('button', { name: 'Chọn tệp bàn giao' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Gửi bàn giao' }));
  await waitFor(() => expect(orderApi.submitDelivery).toHaveBeenCalledWith('o1', { message: '', files: [{ fileId: 'file1' }] }));
  expect(orderApi.uploadFile).toHaveBeenCalledWith('o1', 'DELIVERY', expect.any(FormData));
  await waitFor(() => expect(orderApi.getDeliveries).toHaveBeenCalledTimes(2));
});

test('oversized delivery files never reach the upload endpoint', async () => {
  (getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ name: 'huge.pdf', uri: 'file:///huge.pdf', size: 50 * 1024 * 1024 + 1 }] });
  await renderCard();
  await fireEvent.press(await screen.findByRole('button', { name: 'Chọn tệp bàn giao' }));
  expect(await screen.findByText('Tệp bàn giao tối đa 50 MB.')).toBeTruthy();
  expect(orderApi.uploadFile).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Gửi bàn giao' })).toBeDisabled();
});

test('participant downloads the signed Order file with bearer authentication', async () => {
  (orderApi.getDeliveries as jest.Mock).mockResolvedValue({ result: [delivery] });
  await renderCard('CLIENT');
  await fireEvent.press(await screen.findByRole('button', { name: 'Tải logo.pdf' }));
  expect(await screen.findByText('Đã lưu logo.pdf')).toBeTruthy();
  expect(orderApi.getDownloadUrl).toHaveBeenCalledWith('o1', 'file1');
  expect(fetch).toHaveBeenCalledWith(
    'http://10.0.2.2:8888/api/v1/order/orders/files/file1/content?expires=123&signature=abc',
    { headers: { Authorization: 'Bearer token1' }, redirect: 'error', signal: expect.any(AbortSignal) }
  );
  expect(mockPipeTo).toHaveBeenCalledWith('output-stream', { signal: expect.any(AbortSignal) });
  expect(screen.queryByRole('button', { name: 'Gửi bàn giao' })).toBeNull();
});

test('failed signed download never reports success', async () => {
  (orderApi.getDeliveries as jest.Mock).mockResolvedValue({ result: [delivery] });
  mockPipeTo.mockRejectedValueOnce(new Error('Download interrupted'));
  await renderCard('CLIENT');
  await fireEvent.press(await screen.findByRole('button', { name: 'Tải logo.pdf' }));
  expect(await screen.findByText('Download interrupted')).toBeTruthy();
  expect(mockOutput.delete).toHaveBeenCalled();
  expect(screen.queryByText('Đã lưu logo.pdf')).toBeNull();
});
