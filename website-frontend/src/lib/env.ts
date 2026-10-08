export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888";

export const API_MODE = {
  identity: "live",
  catalog: "live",
  posts: "live",
  payments: "live",
  wallet: "live",
  trust: "live",
  orders: "live",
} as const;

export const FLAGS = {
  services: true,
  messaging: false,
  favorites: false,
} as const;
