export type DisputeKind = "REPORT" | "DISPUTE";
export type DisputeStatus = "OPEN" | "RESOLVED";

export type Dispute = {
  ticketId: string;
  kind: DisputeKind;
  orderId: string;
  reason: string;
  evidenceUrl?: string;
  status: DisputeStatus;
  createdAt: string;
};

export const mockDisputes: Dispute[] = [
  {
    ticketId: "TCK-101",
    kind: "REPORT",
    orderId: "ORD-1042",
    reason: "Người bán giao sản phẩm không đúng mô tả đã cam kết trong đơn hàng, hình ảnh khác xa thực tế.",
    status: "OPEN",
    createdAt: "2026-10-09",
  },
  {
    ticketId: "TCK-102",
    kind: "DISPUTE",
    orderId: "ORD-1038",
    reason: "Hai bên chưa thống nhất thời gian nghiệm thu, cần WorkGo đứng ra hòa giải và giữ tiền bảo chứng.",
    evidenceUrl: "https://example.com/bien-ban-nghiem-thu",
    status: "OPEN",
    createdAt: "2026-10-05",
  },
  {
    ticketId: "TCK-103",
    kind: "REPORT",
    orderId: "ORD-1021",
    reason: "Tài khoản có dấu hiệu spam tin nhắn chào mời ngoài hệ thống, đã nhắc nhở và xử lý xong.",
    status: "RESOLVED",
    createdAt: "2026-09-20",
  },
];
