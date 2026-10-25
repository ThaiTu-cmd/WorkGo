import axiosClient from './axiosClient';

// Work evidence for ONSITE orders (order-service, /orders/{orderId}/evidence).
// Only the order's provider may upload, and only while the order is IN_PROGRESS
// and its onsite execution is IN_SERVICE; both sides of the order may read.
export const EVIDENCE_PHASES = [
  { value: 'BEFORE', label: 'Trước khi làm', short: 'Trước', tone: 'info' },
  { value: 'DURING', label: 'Đang làm', short: 'Đang làm', tone: 'progress' },
  { value: 'AFTER', label: 'Sau khi làm', short: 'Sau', tone: 'success' },
  { value: 'ISSUE', label: 'Sự cố', short: 'Sự cố', tone: 'warning' },
];

export const phaseOf = (value) => EVIDENCE_PHASES.find((p) => p.value === value) ?? EVIDENCE_PHASES[0];

// order-service error codes → messages a provider can act on.
const ERROR_MESSAGES = {
  1008: 'Chỉ chuyên gia nhận đơn này mới được gửi bằng chứng.',
  2004: 'Bằng chứng chỉ áp dụng cho dịch vụ tại nhà.',
  2021: 'Chỉ gửi được bằng chứng khi đơn đang được thực hiện tại nhà.',
  2022: 'Vui lòng chọn giai đoạn của bằng chứng.',
  2023: 'Vui lòng chụp hoặc chọn một ảnh.',
};

export const evidenceErrorMessage = (err) =>
  ERROR_MESSAGES[err?.code] || err?.message || 'Không gửi được bằng chứng. Vui lòng thử lại.';

export const evidenceApi = {
  // WorkEvidenceResponse { workEvidenceId, executionId, phase, uploadedBy, fileUrl,
  //   latitude, longitude, capturedAt, createdAt }, paged and newest first.
  getEvidence: (orderId, { phase, page = 0, size = 50 } = {}) =>
    axiosClient.get(`/order/orders/${orderId}/evidence`, {
      params: phase ? { phase, page, size } : { page, size },
    }),

  // body: { phase, fileUrl, latitude?, longitude?, capturedAt? }
  createEvidence: (orderId, body) => axiosClient.post(`/order/orders/${orderId}/evidence`, body),
};

export default evidenceApi;
