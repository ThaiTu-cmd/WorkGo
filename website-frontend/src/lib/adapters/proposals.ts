// BLOCKED BY BACKEND: Proposals and Applications domain endpoints are not yet implemented in backend (xlsx 48.0, 49.0)

import { MOCK_PROPOSALS } from "../mocks/fixtures";
import type { ProposalFormData } from "../schemas/proposal";

export type ProposalItem = typeof MOCK_PROPOSALS[number];

const localProposals = [...MOCK_PROPOSALS];
const appliedPostIds = new Set<string>();

export const proposalsApi = {
  async listForPost(postId: string): Promise<ProposalItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return localProposals.filter((p) => p.postId === postId);
  },

  async listAllClientApplications(statusFilter?: string): Promise<ProposalItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!statusFilter || statusFilter === "ALL") {
      return localProposals;
    }
    return localProposals.filter((p) => p.status === statusFilter);
  },

  async hasApplied(postId: string): Promise<boolean> {
    return appliedPostIds.has(postId);
  },

  async submit(postId: string, data: ProposalFormData): Promise<ProposalItem> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newProp: ProposalItem = {
      proposalId: `prop-${Date.now()}`,
      postId,
      providerId: "my-provider-id",
      providerName: "Trần Hữu Trung (Bạn)",
      providerAvatar: null,
      providerType: "INDIVIDUAL",
      ratingAvg: 5.0,
      ratingCount: 1,
      price: data.price,
      estimatedDays: data.estimatedDays,
      message: data.message,
      terms: data.terms || "",
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    localProposals.unshift(newProp);
    appliedPostIds.add(postId);
    return newProp;
  },

  async accept(proposalId: string): Promise<ProposalItem> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const prop = localProposals.find((p) => p.proposalId === proposalId);
    if (!prop) throw new Error("Không tìm thấy đề xuất");
    prop.status = "ACCEPTED";
    return prop;
  },

  async reject(proposalId: string): Promise<ProposalItem> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const prop = localProposals.find((p) => p.proposalId === proposalId);
    if (!prop) throw new Error("Không tìm thấy đề xuất");
    prop.status = "REJECTED";
    return prop;
  },
};
