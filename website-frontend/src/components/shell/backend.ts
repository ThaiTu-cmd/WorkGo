// Seam between feature pages and the marketplace API layer: pages
// import backend access from here, never from marketplace/ directly.
export { authApi, splitFullName, joinFullName } from "@/marketplace/api/authApi";
export { addressApi } from "@/marketplace/api/addressApi";
export { providerApi } from "@/marketplace/api/providerApi";
export { verificationApi } from "@/marketplace/api/verificationApi";
export { catalogApi } from "@/marketplace/api/catalogApi";
export { availabilityApi, instantToTime, timeToInstant, timeToMinutes, WEEK_DAYS } from "@/marketplace/api/availabilityApi";
export { orderApi, isOrderable, orderErrorMessage, ORDERABLE_EXECUTION_TYPES, NOT_ORDERABLE_MESSAGE } from "@/marketplace/api/orderApi";
export { evidenceApi, EVIDENCE_PHASES, phaseOf, evidenceErrorMessage } from "@/marketplace/api/evidenceApi";
export { fromAddressForm, pageItems, toAddress, toProvider, toPackages, toAddons, toMediaList, toServiceCard, toServiceDetail, toMyServiceRow, toRowStatus, toServiceStatus } from "@/marketplace/api/adapters";
export { NOT_PROVIDER_MESSAGE, getAccessToken, setAccessToken, buildApiErrorMessage } from "@/marketplace/api/axiosClient";
export { useAuthToken } from "@/marketplace/hooks/useAuthToken";
export { adminApi } from "@/marketplace/api/adminApi";
export { ApiError } from "@/marketplace/api/axiosClient";
export { decodeToken, hasRole } from "@/marketplace/utils/jwt";
export { messageApi, messageErrorMessage, ME, unreadOf, totalUnread } from "@/marketplace/api/messageApi";
export { useMessages } from "@/marketplace/hooks/useMessages";
export { jobApi } from "@/marketplace/api/jobApi";
export { trustApi } from "@/marketplace/api/trustApi";
export { notificationApi } from "@/marketplace/api/notificationApi";
export { paymentApi, paymentErrorMessage, newIdempotencyKey, MOCK_PAYMENT_ENABLED, TOP_UP_MINIMUM_VND } from "@/marketplace/api/paymentApi";
export { compressImage } from "@/marketplace/utils/compressImage";
