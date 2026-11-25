export function moderationActions(section, item, roles, userId) {
  if (!roles.includes('ADMIN') || !item) return [];
  if (section === 'jobs') return [item.moderationHidden ? 'show' : 'hide'];
  if (section === 'reviews') {
    if (item.moderationStatus === 'REJECTED') return [];
    return ['APPROVED', 'REJECTED', 'HIDDEN'].filter(status => status !== item.moderationStatus);
  }
  if (section === 'reports') {
    if (['RESOLVED', 'REJECTED'].includes(item.status)) return [];
    return ['REVIEWING', 'RESOLVED', 'REJECTED'].filter(status => status !== item.status);
  }
  if (section !== 'disputes') return [];
  if (item.status === 'OPEN' && !item.assignedAdminId) return ['takeOver'];
  if (item.assignedAdminId !== userId) return [];
  if (item.status === 'UNDER_REVIEW' && !item.decisionId) {
    return item.evidenceRequest ? ['resolve'] : ['requestEvidence', 'resolve'];
  }
  const decision = item.decision;
  if (item.status === 'UNDER_REVIEW' && decision?.executionStatus === 'NEEDS_RECONCILIATION' && !decision.terminalConflict) return ['retry'];
  return [];
}

export function moderationDetailVisible(detail, selectedId, userId) {
  return Boolean(detail && detail.id === selectedId && detail.userId === userId);
}

export function disputeDecisionBody(form) {
  const reason = form.reason?.trim();
  const evidenceSummary = form.evidenceSummary?.trim();
  const operation = form.operation;
  const branch = operation === 'REFUND' ? form.branch : 'NONE';
  const faultType = form.faultType || 'NONE';
  const lateCycles = faultType === 'LATE' ? Number(form.lateCycles) : 0;
  const supersedesDecisionId = form.supersedesDecisionId?.trim();
  if (!reason || reason.length > 1000 || !evidenceSummary || evidenceSummary.length > 2000
    || !Number.isInteger(form.expectedVersion) || form.expectedVersion < 0
    || !['REJECT', 'RELEASE', 'REFUND'].includes(operation)
    || operation === 'REFUND' && !['CLIENT', 'PROVIDER'].includes(branch)
    || !['NONE', 'LATE', 'ABANDONMENT', 'CAPABILITY', 'CORRECTION'].includes(faultType)
    || faultType === 'LATE' && (!Number.isInteger(lateCycles) || lateCycles < 1 || lateCycles > 6)
    || ['ABANDONMENT', 'CAPABILITY'].includes(faultType) && (operation !== 'REFUND' || branch !== 'PROVIDER')
    || faultType === 'CORRECTION' && (operation !== 'REJECT' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(supersedesDecisionId || '')))
    return null;
  return { reason, evidenceSummary, expectedVersion: form.expectedVersion, operation, branch, faultType, lateCycles,
    ...(faultType === 'CORRECTION' ? { supersedesDecisionId } : {}) };
}
