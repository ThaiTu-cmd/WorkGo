import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as React from 'react';

import { trustApi } from '@/api/trustApi';
import type { DisputeDto } from '@/api/types';
import { DisputeCenterScreen } from '../DisputeCenterScreen';
import { DisputeDetailScreen } from '../DisputeDetailScreen';
import { ReputationScreen } from '../ReputationScreen';

jest.mock('@/api/trustApi', () => ({
  trustApi: {
    getMyDisputes: jest.fn(),
    createDispute: jest.fn(),
    getDispute: jest.fn(),
    cancelDispute: jest.fn(),
    supplementEvidence: jest.fn(),
    submitReport: jest.fn(),
    getProviderReputation: jest.fn(),
    submitAppeal: jest.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockDisputeItem: DisputeDto = {
  disputeId: 'DISP-101',
  orderId: 'ORD-1042',
  openedByRole: 'CLIENT',
  reason: 'Sản phẩm bàn giao không đúng với thỏa thuận ban đầu',
  description: 'Mô tả chi tiết sự việc phát sinh',
  evidenceUrl: 'https://example.com/evidence1.jpg',
  status: 'OPEN',
  createdAt: '2026-10-15T10:00:00Z',
  supplementaryEvidences: [
    {
      evidenceUrl: 'https://example.com/evidence2.jpg',
      note: 'Biên bản nghiệm thu chưa ký',
      submittedAt: '2026-10-16 11:00',
    },
  ],
  decision: {
    type: 'SPLIT',
    reason: 'Hòa giải phân chia 50/50',
    providerPercent: 50,
    clientPercent: 50,
    decidedAt: '2026-10-17',
    settlementStatus: 'SPLIT_COMPLETED',
  },
};

describe('DisputeCenterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('renders dispute list from trustApi', async () => {
    (trustApi.getMyDisputes as jest.Mock).mockResolvedValueOnce({
      result: {
        data: [mockDisputeItem],
      },
    });

    await renderWithClient(<DisputeCenterScreen />);

    expect(await screen.findByText('DISP-101')).toBeTruthy();
    expect(screen.getByText('Đơn hàng: ORD-1042')).toBeTruthy();
    expect(screen.getAllByText('Đang mở').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sản phẩm bàn giao không đúng với thỏa thuận ban đầu')).toBeTruthy();
  });

  test('allows opening form and submitting a new dispute', async () => {
    (trustApi.getMyDisputes as jest.Mock).mockResolvedValueOnce({
      result: { data: [] },
    });
    (trustApi.createDispute as jest.Mock).mockResolvedValueOnce({
      result: { disputeId: 'DISP-999' },
    });

    await renderWithClient(<DisputeCenterScreen />);

    // Press open form
    const openBtn = await screen.findByLabelText('+ Mở khiếu nại / Báo cáo');
    await fireEvent.press(openBtn);

    expect(await screen.findByText('Tạo phiếu khiếu nại đơn hàng')).toBeTruthy();

    // Fill form
    await fireEvent.changeText(screen.getByLabelText('Mã đơn hàng'), 'ORD-2000');
    await fireEvent.changeText(
      screen.getByLabelText('Lý do tóm tắt (tối thiểu 20 ký tự)'),
      'Đây là lý do khiếu nại chi tiết có độ dài trên 20 ký tự để vượt qua validation'
    );
    await fireEvent.changeText(screen.getByLabelText('Mô tả chi tiết'), 'Mô tả hỗ trợ');

    // Submit
    await fireEvent.press(screen.getByLabelText('Gửi phiếu yêu cầu'));

    await waitFor(() => {
      expect(trustApi.createDispute).toHaveBeenCalledWith({
        orderId: 'ORD-2000',
        reason: 'Đây là lý do khiếu nại chi tiết có độ dài trên 20 ký tự để vượt qua validation',
        description: 'Mô tả hỗ trợ',
        evidenceUrl: undefined,
      });
    });
  });

  test('triggers onSelectDispute when clicking a dispute card', async () => {
    (trustApi.getMyDisputes as jest.Mock).mockResolvedValueOnce({
      result: {
        data: [mockDisputeItem],
      },
    });

    const onSelect = jest.fn();
    await renderWithClient(<DisputeCenterScreen onSelectDispute={onSelect} />);

    expect(await screen.findByText('DISP-101')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Khiếu nại DISP-101'));

    expect(onSelect).toHaveBeenCalledWith(mockDisputeItem);
  });
});

describe('DisputeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('renders 4-step timeline, 3-way decision, and settlement status', async () => {
    (trustApi.getDispute as jest.Mock).mockResolvedValueOnce({
      result: mockDisputeItem,
    });

    await renderWithClient(<DisputeDetailScreen disputeId="DISP-101" initialDispute={mockDisputeItem} />);

    expect(await screen.findByText('Tiến trình hòa giải & Xử lý')).toBeTruthy();
    expect(screen.getByText('1. Mở hồ sơ & Đóng băng Escrow')).toBeTruthy();
    expect(screen.getByText('2. Ban quản trị thẩm định')).toBeTruthy();
    expect(screen.getByText('3. Bổ sung chứng cứ đối chất')).toBeTruthy();
    expect(screen.getByText('4. Phán quyết & Giải ngân')).toBeTruthy();

    // 3-way decision options
    expect(screen.getByText('1. RELEASE')).toBeTruthy();
    expect(screen.getByText('2. REFUND')).toBeTruthy();
    expect(screen.getByText('3. SPLIT')).toBeTruthy();

    // Settlement status
    expect(screen.getByText('Tài chính: SPLIT_COMPLETED')).toBeTruthy();
  });

  test('allows submitting supplementary evidence', async () => {
    (trustApi.getDispute as jest.Mock).mockResolvedValueOnce({
      result: mockDisputeItem,
    });
    (trustApi.supplementEvidence as jest.Mock).mockResolvedValueOnce({
      result: { disputeId: 'DISP-101' },
    });

    await renderWithClient(<DisputeDetailScreen disputeId="DISP-101" initialDispute={mockDisputeItem} />);

    // Open supplement form
    const suppBtn = await screen.findByLabelText('+ Bổ sung chứng cứ đối chất');
    await fireEvent.press(suppBtn);

    expect(await screen.findByText('Bổ sung chứng cứ theo yêu cầu Admin')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Lời giải trình bổ sung'),
      'Giải trình bổ sung kèm ảnh nghiệm thu thực địa'
    );

    await fireEvent.press(screen.getByLabelText('Gửi bổ sung'));

    await waitFor(() => {
      expect(trustApi.supplementEvidence).toHaveBeenCalledWith('DISP-101', {
        evidenceUrl: undefined,
        note: 'Giải trình bổ sung kèm ảnh nghiệm thu thực địa',
      });
    });
  });
});

describe('ReputationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  test('renders reputation score, tier badge, and history ledger', async () => {
    (trustApi.getProviderReputation as jest.Mock).mockResolvedValueOnce({
      result: {
        providerId: 'p1',
        score: 92,
        tier: 'Hạng A',
        ledger: [
          {
            id: 'l1',
            timestamp: '2026-10-15',
            event: 'Đơn hàng xuất sắc',
            source: 'ORDER_COMPLETED',
            delta: 5,
            balance: 92,
            referenceId: 'ORD-1042',
          },
        ],
      },
    });

    await renderWithClient(<ReputationScreen providerId="p1" />);

    expect(await screen.findByText('92')).toBeTruthy();
    expect(screen.getByText('/ 100')).toBeTruthy();
    expect(screen.getByText('Hạng A — Xuất sắc')).toBeTruthy();
    expect(screen.getByText('Sổ cái biến động uy tín (History Ledger)')).toBeTruthy();
    expect(screen.getByText('Đơn hàng xuất sắc')).toBeTruthy();
  });

  test('allows submitting sanction appeal', async () => {
    (trustApi.getProviderReputation as jest.Mock).mockResolvedValueOnce({
      result: { providerId: 'p1', score: 85, tier: 'Hạng A', ledger: [] },
    });
    (trustApi.submitAppeal as jest.Mock).mockResolvedValueOnce({
      result: { appealId: 'APP-100', status: 'PENDING', submittedAt: '2026-10-20' },
    });

    await renderWithClient(<ReputationScreen providerId="p1" />);

    const appealBtn = await screen.findByLabelText('Gửi đơn khiếu nại / Kháng nghị');
    await fireEvent.press(appealBtn);

    expect(await screen.findByText('Đơn kháng nghị tới Ban Quản Trị:')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Lý do kháng nghị (tối thiểu 20 ký tự)'),
      'Lý do kháng nghị đầy đủ chi tiết hơn 20 ký tự hợp lệ'
    );

    await fireEvent.press(screen.getByLabelText('Gửi đơn kháng nghị'));

    await waitFor(() => {
      expect(trustApi.submitAppeal).toHaveBeenCalledWith({
        sanctionId: undefined,
        reason: 'Lý do kháng nghị đầy đủ chi tiết hơn 20 ký tự hợp lệ',
        explanation: '',
        evidenceUrl: undefined,
      });
    });
  });
});
