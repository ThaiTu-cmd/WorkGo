import { http } from './client';
import type { ApiResponse, EvidenceDto, EvidencePhase, Paged } from './types';
import { translate } from '@/i18n';

// Work evidence for ONSITE orders (order-service, /orders/{orderId}/evidence).
// Only the order's provider may upload, and only while the order is IN_PROGRESS
// and its onsite execution is IN_SERVICE; both sides of the order may read.
export const EVIDENCE_PHASES: { value: EvidencePhase; label: string; short: string }[] = [
  {
    value: 'BEFORE',
    get label() {
      return translate('evidenceApi.truoc_khi_lam');
    },
    get short() {
      return translate('evidenceApi.truoc');
    },
  },
  {
    value: 'DURING',
    get label() {
      return translate('evidenceApi.dang_lam');
    },
    get short() {
      return translate('evidenceApi.dang_lam');
    },
  },
  {
    value: 'AFTER',
    get label() {
      return translate('evidenceApi.sau_khi_lam');
    },
    short: 'Sau',
  },
  {
    value: 'ISSUE',
    get label() {
      return translate('evidenceApi.su_co');
    },
    get short() {
      return translate('evidenceApi.su_co');
    },
  },
];

export const phaseOf = (value: EvidencePhase) => EVIDENCE_PHASES.find((p) => p.value === value) ?? EVIDENCE_PHASES[0];

export type EvidenceBody = {
  phase: EvidencePhase;
  fileUrl: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
};

export const evidenceApi = {
  // Paged, newest first.
  getEvidence: (orderId: string, { phase, page = 0, size = 50 }: { phase?: EvidencePhase; page?: number; size?: number } = {}) =>
    http.get<Paged<EvidenceDto>>(`/order/orders/${orderId}/evidence`, { params: { phase, page, size } }),

  createEvidence: (orderId: string, body: EvidenceBody) => http.post<ApiResponse<EvidenceDto>>(`/order/orders/${orderId}/evidence`, body),
};
