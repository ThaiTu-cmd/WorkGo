export function walletHistory(topUps, payouts, fees) {
  return [
    ...topUps.map(row => ({ id: row.topUpId, referenceId: row.topUpCode, type: 'TOPUP', ...row })),
    ...payouts.map(row => ({ id: row.payoutId, referenceId: row.payoutCode, type: 'PAYOUT', ...row })),
    ...fees.map(row => ({ id: row.feeAssessmentId, referenceId: row.orderId, type: 'FEE_DEBT', ...row })),
  ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}
