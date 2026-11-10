export const KEYS = {
  jobs: "workgo_jobs",
  proposals: "workgo_proposals",
  wallet: "workgo_wallet",
  disputes: "workgo_disputes",
  addresses: "workgo_addresses",
  profile: "workgo_profile",
  payout: "workgo_payout",
  providerRequest: "workgo_provider_request",
  authToken: "accessToken",
} as const;

export type WorkGoKey = (typeof KEYS)[keyof typeof KEYS];
