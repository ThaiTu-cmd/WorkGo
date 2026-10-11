import { apiFetch, type Envelope } from "../api-client";
import type { ProposalFormData } from "../schemas/proposal";
import { backendRoutes } from "./backend-routes";

export interface ProposalItem {
  proposalId: string;
  postId: string;
  providerId: string;
  providerName: string;
  providerAvatar: string | null;
  providerType: "INDIVIDUAL" | "COMPANY";
  ratingAvg: number;
  ratingCount: number;
  price: number;
  estimatedDays: number;
  message: string;
  terms?: string;
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

function unwrapList(res: Envelope<ProposalItem[]> | ProposalItem[]): ProposalItem[] {
  return ((res && typeof res === "object" && "result" in (res as object) ? (res as Envelope<ProposalItem[]>).result : res) as ProposalItem[]) ?? [];
}

function unwrapOne(res: Envelope<ProposalItem> | ProposalItem): ProposalItem {
  return (res && typeof res === "object" && "result" in (res as object) ? (res as Envelope<ProposalItem>).result as ProposalItem : res as ProposalItem);
}

export const proposalsApi = {
  async listForPost(postId: string, token?: string): Promise<ProposalItem[]> {
    return unwrapList(await apiFetch<Envelope<ProposalItem[]> | ProposalItem[]>(backendRoutes.proposals.forPost(postId), { token }));
  },
  async listAllClientApplications(statusFilter?: string, token?: string): Promise<ProposalItem[]> {
    const qs = statusFilter && statusFilter !== "ALL" ? `status=${encodeURIComponent(statusFilter)}` : "";
    return unwrapList(await apiFetch<Envelope<ProposalItem[]> | ProposalItem[]>(backendRoutes.proposals.myApplications(qs), { token }));
  },
  async hasApplied(postId: string, token?: string): Promise<boolean> {
    try {
      const res = await apiFetch<Envelope<{ applied: boolean }> | { applied: boolean }>(backendRoutes.proposals.hasApplied(postId), { token });
      const v = (res && typeof res === "object" && "result" in (res as object) ? (res as Envelope<{ applied: boolean }>).result : res) as { applied: boolean };
      return Boolean(v?.applied);
    } catch (e: unknown) {
      if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 404) return false;
      throw e;
    }
  },
  async submit(postId: string, data: ProposalFormData, token?: string): Promise<ProposalItem> {
    return unwrapOne(await apiFetch<Envelope<ProposalItem> | ProposalItem>(backendRoutes.proposals.forPost(postId), { method: "POST", body: data, token }));
  },
  async accept(proposalId: string, token?: string): Promise<ProposalItem> {
    return unwrapOne(await apiFetch<Envelope<ProposalItem> | ProposalItem>(backendRoutes.proposals.accept(proposalId), { method: "POST", token }));
  },
  async reject(proposalId: string, token?: string): Promise<ProposalItem> {
    return unwrapOne(await apiFetch<Envelope<ProposalItem> | ProposalItem>(backendRoutes.proposals.reject(proposalId), { method: "POST", token }));
  },
};
