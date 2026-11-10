export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type Proposal = {
  proposalId: string;
  jobId: string;
  providerName: string;
  bidPrice: number;
  durationDays: number;
  message: string;
  status: ProposalStatus;
  createdAt: string;
};

export const mockProposals: Proposal[] = [
  {
    proposalId: "prop-1",
    jobId: "job-1",
    providerName: "Designer Hoàng Nam",
    bidPrice: 2200000,
    durationDays: 5,
    message:
      "Tôi có 4 năm kinh nghiệm thiết kế logo F&B, gửi kèm portfolio 30 mẫu logo quán cà phê đã triển khai thực tế.",
    status: "PENDING",
    createdAt: "2026-10-02",
  },
  {
    proposalId: "prop-2",
    jobId: "job-1",
    providerName: "Studio Sáng Tạo Mới",
    bidPrice: 2800000,
    durationDays: 7,
    message:
      "Studio cam kết 3 phương án logo, chỉnh sửa không giới hạn đến khi hài lòng và bàn giao đầy đủ file gốc.",
    status: "PENDING",
    createdAt: "2026-10-03",
  },
  {
    proposalId: "prop-3",
    jobId: "job-2",
    providerName: "Thợ Điện Lạnh Đức Huy",
    bidPrice: 750000,
    durationDays: 1,
    message:
      "Tôi khảo sát miễn phí trong ngày, báo giá trọn gói trước khi làm, bảo hành 6 tháng sau sửa chữa đầy đủ.",
    status: "PENDING",
    createdAt: "2026-10-04",
  },
];
