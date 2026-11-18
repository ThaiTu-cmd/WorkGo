export type DisputeKind = "REPORT" | "DISPUTE";

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "RESOLVED_CLIENT"
  | "RESOLVED_PROVIDER"
  | "REJECTED"
  | "CANCELLED"
  | "CLOSED";

export type ReportTargetType =
  | "USER"
  | "POST"
  | "JOB"
  | "SERVICE"
  | "MESSAGE"
  | "ORDER"
  | "REVIEW";

export type DisputeDecisionType = "RELEASE" | "REFUND" | "SPLIT";

export type SettlementStatus =
  | "FROZEN"
  | "SETTLED"
  | "REFUNDED"
  | "SPLIT_COMPLETED"
  | "RECONCILIATION_PENDING";

export type DisputeTimelineEvent = {
  step: number;
  title: string;
  desc: string;
  time?: string;
  status: "done" | "active" | "pending";
};

export type SupplementaryEvidence = {
  evidenceUrl: string;
  note?: string;
  submittedAt: string;
};

export type Dispute = {
  id: string;
  ticketId: string;
  kind: DisputeKind;
  orderId: string;
  targetType?: ReportTargetType;
  targetId?: string;
  openedBy?: string;
  openedByRole?: "CLIENT" | "PROVIDER" | string;
  clientId?: string;
  providerId?: string;
  reason: string;
  description?: string;
  evidenceUrl?: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  supplementaryEvidences?: SupplementaryEvidence[];
  decision?: {
    type: DisputeDecisionType;
    reason: string;
    providerPercent?: number;
    clientPercent?: number;
    decidedAt: string;
    settlementStatus: SettlementStatus;
  };
};

export type ReputationSource =
  | "ORDER_COMPLETED"
  | "REVIEW_5_STAR"
  | "LATE_DELIVERY"
  | "ABANDONED_JOB"
  | "DISPUTE_DECISION"
  | "ADMIN_ADJUSTMENT";

export type ReputationLedgerEntry = {
  id: string;
  timestamp: string;
  event: string;
  source: ReputationSource;
  delta: number;
  balance: number;
  referenceId: string;
  note?: string;
};

export type SanctionType = "RESTRICTED" | "SUSPENDED" | "WARNING";

export type SanctionScope = "PROVIDER" | "ACCOUNT";

export type ProviderSanction = {
  id: string;
  type: SanctionType;
  scope: SanctionScope;
  reason: string;
  issuedAt: string;
  expiresAt?: string;
  issuedBy: string;
  status: "ACTIVE" | "LIFTED" | "APPEALED";
};

export type SanctionAppeal = {
  id: string;
  sanctionId?: string;
  disputeId?: string;
  reason: string;
  explanation: string;
  evidenceUrl?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  submittedAt: string;
};

export type ReviewItem = {
  orderId: string;
  stars: number;
  comment: string;
  at: string;
};
