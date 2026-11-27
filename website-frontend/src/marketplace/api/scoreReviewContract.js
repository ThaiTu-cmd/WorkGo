const outcomes = new Set(['KEEP_RESTRICTED', 'BAN_PROVIDER']);
const version = value => Number.isSafeInteger(value) && value >= 0;
const score = value => Number.isInteger(value) && value >= 0 && value <= 4;

function receipt(row, providerId) {
  return row && row.providerId === providerId && typeof row.reviewId === 'string' && row.reviewId.length > 0
    && score(row.score) && version(row.sourceVersion) && outcomes.has(row.outcome)
    && typeof row.reason === 'string' && row.reason.trim().length > 0
    && typeof row.reference === 'string' && row.reference.trim().length > 0
    && typeof row.reviewedAt === 'string' && Number.isFinite(Date.parse(row.reviewedAt))
    && (row.outcome === 'BAN_PROVIDER' ? typeof row.sanctionId === 'string' && row.sanctionId.length > 0 : row.sanctionId == null);
}

export function pendingScoreReviews(response) {
  if (response?.code !== 1000 || !Array.isArray(response.result) || response.result.some(row =>
    !row || typeof row.providerId !== 'string' || !row.providerId || !score(row.score) || !version(row.sourceVersion))) {
    throw new Error('Hàng chờ xét điểm không hợp lệ. Hãy tải lại.');
  }
  return response;
}

export function scoreReviewHistory(response, providerId) {
  if (response?.code !== 1000 || !Array.isArray(response.result) || response.result.some(row => !receipt(row, providerId))) {
    throw new Error('Lịch sử xét điểm không hợp lệ. Hãy thử lại.');
  }
  return response;
}

export function scoreReviewReceipt(response, providerId, command) {
  const row = response?.result;
  if (response?.code !== 1000 || !receipt(row, providerId) || row.sourceVersion !== command.expectedReputationVersion
    || row.outcome !== command.outcome || row.reason !== command.reason.trim() || row.reference !== command.reference.trim()) {
    throw new Error('Chưa nhận được biên nhận đúng quyết định. Thử lại cùng quyết định để đối chiếu.');
  }
  return response;
}
