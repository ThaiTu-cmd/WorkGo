// Seam between the Trung pages and the mirror's live API layer: Trung pages
// import backend access from here, never from _webapp-mirror directly.
export { authApi, splitFullName, joinFullName } from "@/_webapp-mirror/api/authApi";
export { addressApi } from "@/_webapp-mirror/api/addressApi";
export { providerApi } from "@/_webapp-mirror/api/providerApi";
export { fromAddressForm, pageItems, toAddress, toProvider } from "@/_webapp-mirror/api/adapters";
export { NOT_PROVIDER_MESSAGE } from "@/_webapp-mirror/api/axiosClient";
export { useAuthToken } from "@/_webapp-mirror/hooks/useAuthToken";
