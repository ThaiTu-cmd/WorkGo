export type JobType = "DIGITAL" | "ONSITE" | "DELIVERY" | "APPOINTMENT";

export const JOB_TYPES: JobType[] = ["DIGITAL", "ONSITE", "DELIVERY", "APPOINTMENT"];

export type JobStatus = "OPEN" | "CLOSED" | "CANCELLED" | "IN_PROGRESS" | "COMPLETED";

export interface JobAttachment {
  attachmentId?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
}

export interface JobClientInfo {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface JobSummary {
  jobId: string;
  clientId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  executionType: JobType;
  status: JobStatus | string;
  deadlineAt?: string;
  createdAt: string;
  applicationCount: number;
  clientName?: string;
}

export interface JobDetail {
  jobId: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  executionType: JobType;
  locationSnapshot?: string;
  deadlineAt?: string;
  status: JobStatus | string;
  createdAt: string;
  updatedAt?: string;
  attachments?: JobAttachment[];
  client?: JobClientInfo;
}

export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface ProposalItem {
  proposalId: string;
  jobId: string;
  applicationId?: string;
  providerId?: string;
  providerName: string;
  price: number;
  currency?: string;
  estimatedDays: number;
  message: string;
  terms?: string;
  status: ProposalStatus;
  createdAt: string;
  expiresAt?: string;
}

export type OrderSyncStatus = "PENDING" | "SUCCESS" | "FAILED" | "RETRY";

export interface ProposalAcceptance {
  proposal: ProposalItem;
  orderSyncStatus: OrderSyncStatus;
  orderId?: string;
}
