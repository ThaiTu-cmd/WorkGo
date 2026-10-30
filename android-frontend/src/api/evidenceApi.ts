import { http } from './client';
import type { ApiResponse, EvidenceDto, EvidencePhase, Paged } from './types';

// Work evidence for ONSITE orders (order-service, /orders/{orderId}/evidence).
// Only the order's provider may upload, and only while the order is IN_PROGRESS
// and its onsite execution is IN_SERVICE; both sides of the order may read.
export const EVIDENCE_PHASES: { value: EvidencePhase; label: string; short: string }[] = [
  { value: 'BEFORE', label: 'Trước khi làm', short: 'Trước' },
  { value: 'DURING', label: 'Đang làm', short: 'Đang làm' },
  { value: 'AFTER', label: 'Sau khi làm', short: 'Sau' },
  { value: 'ISSUE', label: 'Sự cố', short: 'Sự cố' },
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
