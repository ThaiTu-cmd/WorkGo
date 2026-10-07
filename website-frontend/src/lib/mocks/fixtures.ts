// Mock domain fixtures for domains blocked by backend

export type ExecutionType =
  | "DIGITAL"
  | "ONSITE"
  | "DELIVERY"
  | "APPOINTMENT"
  | "HOURLY"
  | "PROJECT";

export type PostStatus = "OPEN" | "PAUSED" | "CLOSED";

export interface PostClientInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
  ratingAvg: number;
  completedOrders: number;
  responseTime: string;
}

export interface MockPostItem {
  postId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  budgetMin: number;
  budgetMax: number;
  executionType: ExecutionType;
  locationSnapshot: string;
  deadlineAt: string;
  attachments: string[];
  status: PostStatus;
  client: PostClientInfo;
  proposalsCount: number;
  createdAt: string;
}

export interface MockPayoutAccount {
  id: string;
  accountType: "BANK" | "WALLET";
  bankCode?: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  status: "ACTIVE" | "PENDING";
}

export const MOCK_POSTS: MockPostItem[] = [
  {
    postId: "post-101",
    title: "Thiết kế giao diện website thương mại điện tử chuẩn Brand và Responsive",
    description:
      "Cần tìm Senior UI/UX Designer thiết kế hệ thống giao diện 12 màn hình chính cho website thương mại điện tử chuyên đồ gia dụng. Yêu cầu bàn giao Figma Design System và component tokens hoàn chỉnh.",
    categoryId: "cat-1",
    categoryName: "Thiết kế & Đồ họa",
    budgetMin: 5000000,
    budgetMax: 10000000,
    executionType: "DIGITAL" as const,
    locationSnapshot: "Trực tuyến",
    deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: ["spec_v1.pdf", "brand_guidelines.png"],
    status: "OPEN" as const,
    client: {
      userId: "u-client-1",
      name: "Trần Anh Khoa",
      avatarUrl: null,
      ratingAvg: 4.9,
      completedOrders: 14,
      responseTime: "Trong vòng 1 giờ",
    },
    proposalsCount: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    postId: "post-102",
    title: "Phát triển ứng dụng di động Flutter kết nối hệ thống Backend Spring Boot",
    description:
      "Dự án cần phát triển ứng dụng di động đa nền tảng iOS & Android tích hợp thanh toán VnPay, bản đồ định vị thời gian thực và quản lý đơn hàng. Đã có sẵn tài liệu Swagger API chi tiết.",
    categoryId: "cat-2",
    categoryName: "Lập trình & Công nghệ",
    budgetMin: 15000000,
    budgetMax: 25000000,
    executionType: "DIGITAL" as const,
    locationSnapshot: "Trực tuyến",
    deadlineAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: ["swagger_api.json"],
    status: "OPEN" as const,
    client: {
      userId: "u-client-2",
      name: "Nguyễn Minh Châu",
      avatarUrl: null,
      ratingAvg: 5.0,
      completedOrders: 8,
      responseTime: "Trong vòng 30 phút",
    },
    proposalsCount: 5,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    postId: "post-103",
    title: "Bảo dưỡng và vệ sinh 5 máy lạnh công nghiệp tại văn phòng Quận 1",
    description:
      "Yêu cầu thợ kỹ thuật có chứng chỉ điện lạnh đến vệ sinh, nạp gas và kiểm tra toàn diện 5 máy lạnh Daikin âm trần tại toà nhà văn phòng Phường Bến Nghé, Quận 1. Đảm bảo vệ sinh sạch sẽ, không ảnh hưởng sàn gỗ.",
    categoryId: "cat-5",
    categoryName: "Sửa chữa & Kỹ thuật tại nhà",
    budgetMin: 1500000,
    budgetMax: 2500000,
    executionType: "ONSITE" as const,
    locationSnapshot: "Số 36 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    deadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [],
    status: "OPEN" as const,
    client: {
      userId: "u-client-3",
      name: "Công ty Cổ phần TechGo",
      avatarUrl: null,
      ratingAvg: 4.8,
      completedOrders: 25,
      responseTime: "Trong vòng 2 giờ",
    },
    proposalsCount: 2,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_PROPOSALS = [
  {
    proposalId: "prop-1",
    postId: "post-101",
    providerId: "prov-1",
    providerName: "Nguyễn Văn Hùng",
    providerAvatar: null,
    providerType: "INDIVIDUAL" as const,
    ratingAvg: 4.9,
    ratingCount: 38,
    price: 7500000,
    estimatedDays: 5,
    message:
      "Chào anh Khoa! Tôi là Senior UI/UX Designer với hơn 6 năm kinh nghiệm thực chiến. Tôi đã từng xây dựng Design System cho hơn 15 dự án thương mại điện tử. Cam kết tiến độ 5 ngày bàn giao đầy đủ file Figma componentized và interactive prototype.",
    terms: "Bao gồm 2 lần chỉnh sửa miễn phí sau nghiệm thu.",
    status: "SUBMITTED" as "SUBMITTED" | "ACCEPTED" | "REJECTED",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    proposalId: "prop-2",
    postId: "post-101",
    providerId: "prov-2",
    providerName: "Design Agency Alpha",
    providerAvatar: null,
    providerType: "COMPANY" as const,
    ratingAvg: 4.7,
    ratingCount: 82,
    price: 9000000,
    estimatedDays: 4,
    message:
      "Đội ngũ Alpha gồm 3 designer chuyên sâu Ecommerce sẽ phối hợp thực hiện dự án của bạn để tối ưu tỉ lệ chuyển đổi (CRO). Bàn giao kèm design tokens đồng bộ Tailwind CSS.",
    terms: "Hợp đồng xuất hóa đơn VAT đầy đủ.",
    status: "SUBMITTED" as "SUBMITTED" | "ACCEPTED" | "REJECTED",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_WALLET = {
  availableBalance: 12500000,
  escrowBalance: 7500000,
  earnedBalance: 48000000,
  transactions: [
    {
      id: "tx-1",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: "DEPOSIT" as const,
      amount: 5000000,
      balanceAfter: 12500000,
      reference: "DEP-928172",
      description: "Nạp tiền qua Chuyển khoản QR ngân hàng",
    },
    {
      id: "tx-2",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      type: "ORDER_PAYMENT" as const,
      amount: -7500000,
      balanceAfter: 7500000,
      reference: "ORD-55102",
      description: "Thanh toán tạm giữ Escrow cho đơn hàng ORD-55102",
    },
    {
      id: "tx-3",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      type: "ORDER_RELEASE" as const,
      amount: 15000000,
      balanceAfter: 15000000,
      reference: "ORD-44910",
      description: "Giải ngân tiền dịch vụ hoàn thành đơn hàng ORD-44910",
    },
  ],
};

export const MOCK_PAYOUT_ACCOUNTS: MockPayoutAccount[] = [
  {
    id: "payout-1",
    accountType: "BANK" as const,
    bankCode: "VCB",
    bankName: "Ngân hàng Ngoại thương Việt Nam (Vietcombank)",
    accountNumber: "0071001234567",
    accountHolderName: "TRAN HUU TRUNG",
    isDefault: true,
    status: "ACTIVE" as const,
  },
];

export const MOCK_BANKS = [
  { code: "VCB", name: "Vietcombank (Ngoại thương)" },
  { code: "TCB", name: "Techcombank (Kỹ thương)" },
  { code: "MB", name: "MBBank (Quân đội)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "BIDV", name: "BIDV (Đầu tư và Phát triển)" },
  { code: "CTG", name: "VietinBank (Công thương)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
];

export const MOCK_ORDER = {
  orderId: "ord-8812",
  orderNumber: "WG-ORD-8812",
  serviceTitle: "Thiết kế Logo & Bộ nhận diện thương hiệu công ty",
  providerName: "Nguyễn Văn Hùng",
  amount: 6000000,
  status: "COMPLETED" as const,
  completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export const MOCK_DISPUTE = {
  disputeId: "disp-441",
  orderId: "ord-8812",
  orderNumber: "WG-ORD-8812",
  serviceTitle: "Thiết kế Logo & Bộ nhận diện thương hiệu công ty",
  amount: 6000000,
  reason: "Sản phẩm giao không đúng yêu cầu ban đầu và trễ hẹn 4 ngày",
  description:
    "Đối tác cam kết bàn giao trong 3 ngày nhưng kéo dài sang ngày thứ 7 mới gửi bản nháp không đúng phong cách đã thống nhất. Sau khi yêu cầu chỉnh sửa, đối tác không phản hồi tin nhắn.",
  timeline: [
    {
      status: "OPEN",
      title: "Đã gửi khiếu nại",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      note: "Khách hàng mở khiếu nại yêu cầu hoàn tiền 50% tiền cọc.",
    },
    {
      status: "UNDER_REVIEW",
      title: "Ban quản trị đang xem xét",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      note: "Admin WorkGo đã tiếp nhận bằng chứng và yêu cầu 2 bên phản hồi.",
    },
  ],
  resolution:
    "Khiếu nại đang được đội ngũ giải quyết tranh chấp thụ lý. Kết quả phán quyết sẽ được thông báo trong vòng 24 giờ làm việc.",
  evidence: ["screenshot_chat_log.png", "figma_revision_history.pdf"],
};
