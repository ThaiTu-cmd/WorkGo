// Envelope every WorkGo service wraps its payload in.
export type ApiResponse<T> = { code?: number; message?: string; result: T };

// Spring PageResponse inside ApiResponse.result.
export type PageResponse<T> = {
  data: T[];
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalElements?: number;
};

export type Paged<T> = ApiResponse<PageResponse<T>>;

// Backend sends BigDecimal/double; older builds sometimes serialise them as strings.
type Num = number | string;

export type ExecutionType = 'DIGITAL' | 'ONSITE';
export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

// ---- catalog-service ----
export type CategoryDto = {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string | null;
  parent?: string | null;
  children?: CategoryDto[] | null;
};

export type ServiceDto = {
  serviceId: string;
  providerId: string;
  categoryId: string;
  executionType: ExecutionType;
  title: string;
  slug?: string;
  description?: string | null;
  basePrice?: Num | null;
  currency?: string;
  status?: ServiceStatus;
  avgRating?: Num | null;
  reviewCount?: Num | null;
  orderCount?: Num | null;
  publishedAt?: string | null;
  createdAt?: string;
};

export type PackageDto = {
  packageId: string;
  name: string;
  description?: string | null;
  price: Num;
  currency?: string;
  deliveryDay?: number | null;
  durationMinute?: number | null;
  revisionLimit?: number | null;
  packageStatus?: string | null;
};

export type AddonDto = {
  addOnId: string | null;
  name: string;
  description?: string | null;
  price: Num;
  status?: string | null;
};

export type MediaDto = {
  serviceMediaId: string;
  url: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'FILE';
  cover?: boolean;
};

export type RuleDto = {
  availableRuleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinute: number;
  status?: string;
  serviceId?: string;
};

export type BookingSlotDto = {
  bookingSlotId: string;
  startedAt: string;
  endAt: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
  availableRuleId?: string | null;
};

// ---- identity-service ----
export type ProviderProfileDto = {
  providerProfileId: string;
  providerType?: 'INDIVIDUAL' | 'COMPANY' | null;
  businessName?: string | null;
  bio?: string | null;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | string | null;
  joinedAt?: string | null;
  userId?: string;
};

export type AddressDto = {
  addressId: string;
  label?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  line1?: string | null;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  note?: string | null;
  countryCode?: string | null;
};

// ---- order-service ----
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type OrderRole = 'CLIENT' | 'PROVIDER';

export type OrderDto = {
  orderId: string;
  orderNumber?: string;
  clientId?: string;
  providerId?: string;
  serviceId: string;
  packageId?: string;
  executionType: ExecutionType;
  title: string;
  subtotal?: Num | null;
  platformFee?: Num | null;
  totalAmount?: Num | null;
  currency?: string;
  orderStatus: OrderStatus;
  paymentStatus?: string;
  placedAt?: string | null;
  confirmedAt?: string | null;
  startedAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
};

// GET /orders/{orderId} wraps the order with its items, snapshot and execution.
export type OrderDetailDto = {
  order: OrderDto;
  items?: unknown[];
  snapshot?: unknown;
  execution?: ExecutionDto | null;
};

export type OnsiteStatus = 'SCHEDULED' | 'IN_SERVICE' | 'SERVICE_DONE' | 'ACCEPT' | 'CANCELLED';

export type ExecutionDto = {
  executionType: ExecutionType;
  startedAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  digital?: { status?: string; deadlineAt?: string | null; revisionLimit?: number; revisionsUsed?: number } | null;
  onsite?: {
    status: OnsiteStatus;
    addressSnapshot?: string | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    bookingSlotId?: string | null;
  } | null;
};

export type OrderHistoryDto = {
  orderStatusHistoryId?: string;
  fromStatus?: OrderStatus | null;
  toStatus: OrderStatus;
  roleName?: string | null;
  createdAt: string;
};

export type CancellationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'AUTO_APPROVED';

export type CancellationDto = {
  cancellationRequestId: string;
  orderId: string;
  requestedByRole: OrderRole;
  reasonCode: string;
  note?: string | null;
  status: CancellationStatus;
  respondedAt?: string | null;
  createdAt: string;
};

export type CancellationBody = { reasonCode: string; note?: string };

export type EvidencePhase = 'BEFORE' | 'DURING' | 'AFTER' | 'ISSUE';

export type EvidenceDto = {
  workEvidenceId: string;
  phase: EvidencePhase;
  fileUrl: string;
  latitude?: number | null;
  longitude?: number | null;
  capturedAt?: string | null;
  createdAt?: string;
};

export type OrderCreationRequest = {
  serviceId: string;
  packageId: string;
  addonIds: string[];
  bookingSlotId?: string;
  address?: string;
};

// ---- payment-service ----
export type PaymentGateway = 'MOCK' | 'VNPAY' | 'MOMO';
export type PaymentMethod = 'QR' | 'WALLET' | 'ATM_CARD' | 'INTL_CARD';
export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export type PaymentDto = {
  paymentId: string;
  paymentCode: string;
  orderId: string;
  amount?: Num | null;
  currency?: string;
  gateway: PaymentGateway;
  paymentMethod?: PaymentMethod | null;
  status: PaymentStatus;
  paymentUrl?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};

export type PaymentCreationRequest = { orderId: string; gateway: PaymentGateway; paymentMethod?: PaymentMethod };

export type EscrowStatus = 'PENDING' | 'HOLDING' | 'RELEASED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FROZEN';

export type EscrowDto = {
  escrowAccountId: string;
  orderId: string;
  status: EscrowStatus;
  heldAmount?: Num | null;
  platformFeeAmount?: Num | null;
  providerNetAmount?: Num | null;
  releasedAmount?: Num | null;
  refundedAmount?: Num | null;
  currency?: string;
  heldAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;
};

// ---- trust-service ----
export type ReviewDirection = 'CLIENT_TO_PROVIDER' | 'PROVIDER_TO_CLIENT';

export type ReviewDto = {
  reviewId: string;
  orderId: string;
  serviceId?: string | null;
  reviewerId: string;
  revieweeId: string;
  direction?: ReviewDirection | null;
  rating: number;
  comment?: string | null;
  isPublished?: boolean;
  moderationStatus?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
};

export type RatingSummaryDto = {
  targetId?: string;
  ratingAvg: number;
  ratingCount: number;
  reviews?: PageResponse<ReviewDto>;
};

export type OrderReviewStatusDto = {
  orderId: string;
  myDirection?: ReviewDirection | null;
  myReviewSubmitted: boolean;
  otherPartyReviewed?: boolean;
  isPublished?: boolean;
  reviewWindowExpiresAt?: string | null;
  myReview?: ReviewDto | null;
  otherPartyReview?: ReviewDto | null;
};

export type ReviewSubmitReq = {
  orderId: string;
  rating: number;
  comment?: string;
};

// ---- communication-service ----
export type ConversationType = 'DIRECT_MESSAGE' | 'ORDER_DISCUSSION' | 'SERVICE_INQUIRY' | 'SUPPORT';
export type ContextType = 'GENERAL' | 'ORDER' | 'SERVICE' | 'DISPUTE';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export type ParticipantDto = {
  userId: string;
  joinedAt?: string;
  lastReadMessageId?: string | null;
  role?: string | null;
};

export type ConversationDto = {
  id: string;
  conversationType?: string;
  contextType?: string;
  contextId?: string | null;
  participants?: ParticipantDto[];
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: number;
  createdAt?: string;
};

export type MessageAttachment = {
  fileUrl: string;
  fileName?: string;
  sizeBytes?: number;
};

export type MessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
  clientMessageId?: string;
  sentAt: string;
  readAt?: string | null;
  attachments?: MessageAttachment[];
};

export type ConversationCreateReq = {
  participantId: string;
  conversationType?: string;
  contextType: ContextType;
  contextId?: string | null;
};

export type MessageSendReq = {
  content: string;
  messageType?: MessageType;
  attachments?: MessageAttachment[];
  clientMessageId: string;
};
