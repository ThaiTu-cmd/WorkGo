// Seam between the Trung pages and the mirror's live API layer: Trung pages
// import backend access from here, never from _webapp-mirror directly.
export { authApi, splitFullName, joinFullName } from "@/_webapp-mirror/api/authApi";
export { addressApi } from "@/_webapp-mirror/api/addressApi";
export { providerApi } from "@/_webapp-mirror/api/providerApi";
export { verificationApi } from "@/_webapp-mirror/api/verificationApi";
export { catalogApi } from "@/_webapp-mirror/api/catalogApi";
export { availabilityApi, instantToTime, timeToInstant, timeToMinutes, WEEK_DAYS } from "@/_webapp-mirror/api/availabilityApi";
export { orderApi, isOrderable, ORDERABLE_EXECUTION_TYPES, NOT_ORDERABLE_MESSAGE } from "@/_webapp-mirror/api/orderApi";
export { evidenceApi, EVIDENCE_PHASES, phaseOf, evidenceErrorMessage } from "@/_webapp-mirror/api/evidenceApi";
export { fromAddressForm, pageItems, toAddress, toProvider, toPackages, toAddons, toMediaList, toServiceCard, toServiceDetail, toMyServiceRow, toRowStatus, toServiceStatus } from "@/_webapp-mirror/api/adapters";
export { NOT_PROVIDER_MESSAGE, getAccessToken, setAccessToken, buildApiErrorMessage } from "@/_webapp-mirror/api/axiosClient";
export { useAuthToken } from "@/_webapp-mirror/hooks/useAuthToken";
export { adminApi } from "@/_webapp-mirror/api/adminApi";
export { ApiError } from "@/_webapp-mirror/api/axiosClient";
export { decodeToken, hasRole } from "@/_webapp-mirror/utils/jwt";
export { messageApi, ME, unreadOf, totalUnread } from "@/_webapp-mirror/api/messageApi";
export { useMessages } from "@/_webapp-mirror/hooks/useMessages";
