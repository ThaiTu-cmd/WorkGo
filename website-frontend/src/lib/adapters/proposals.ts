import type { ProposalFormData } from "../schemas/proposal";
import { postsApi } from "./posts";

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

const liveProposals: ProposalItem[] = [
  {
    proposalId: "prop-1",
    postId: "post-101",
    providerId: "prov-1",
    providerName: "Nguyễn Văn Hùng",
    providerAvatar: null,
    providerType: "INDIVIDUAL",
    ratingAvg: 4.9,
    ratingCount: 38,
    price: 7500000,
    estimatedDays: 5,
    message:
      "Chào anh Khoa! Tôi là Senior UI/UX Designer với hơn 6 năm kinh nghiệm thực chiến. Tôi đã từng xây dựng Design System cho hơn 15 dự án thương mại điện tử. Cam kết tiến độ 5 ngày bàn giao đầy đủ file Figma componentized và interactive prototype.",
    terms: "Bao gồm 2 lần chỉnh sửa miễn phí sau nghiệm thu.",
    status: "SUBMITTED",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    proposalId: "prop-2",
    postId: "post-101",
    providerId: "prov-2",
    providerName: "Design Agency Alpha",
    providerAvatar: null,
    providerType: "COMPANY",
    ratingAvg: 4.7,
    ratingCount: 82,
    price: 9000000,
    estimatedDays: 4,
    message:
      "Đội ngũ Alpha gồm 3 designer chuyên sâu Ecommerce sẽ phối hợp thực hiện dự án của bạn để tối ưu tỉ lệ chuyển đổi (CRO). Bàn giao kèm design tokens đồng bộ Tailwind CSS.",
    terms: "Hợp đồng xuất hóa đơn VAT đầy đủ.",
    status: "SUBMITTED",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

const appliedPostIds = new Set<string>();

export const proposalsApi = {
  async listForPost(postId: string): Promise<ProposalItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return liveProposals.filter((p) => p.postId === postId);
  },

  async listAllClientApplications(statusFilter?: string): Promise<ProposalItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (!statusFilter || statusFilter === "ALL") {
      return liveProposals;
    }
    return liveProposals.filter((p) => p.status === statusFilter);
  },

  async hasApplied(postId: string): Promise<boolean> {
    return appliedPostIds.has(postId);
  },

  async submit(postId: string, data: ProposalFormData): Promise<ProposalItem> {
    await new Promise((resolve) => setTimeout(resolve, 150));
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

    liveProposals.unshift(newProp);
    appliedPostIds.add(postId);
    postsApi.incrementProposalCount(postId);
    return newProp;
  },

  async accept(proposalId: string): Promise<ProposalItem> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const prop = liveProposals.find((p) => p.proposalId === proposalId);
    if (!prop) throw new Error("Không tìm thấy đề xuất");
    prop.status = "ACCEPTED";
    return prop;
  },

  async reject(proposalId: string): Promise<ProposalItem> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const prop = liveProposals.find((p) => p.proposalId === proposalId);
    if (!prop) throw new Error("Không tìm thấy đề xuất");
    prop.status = "REJECTED";
    return prop;
  },
};
