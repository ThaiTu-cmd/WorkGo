export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888";

export const API_MODE = {
  identity: "live",
  catalog: "live",
  posts: "mock",
  payments: "mock",
  wallet: "mock",
  trust: "mock",
  orders: "mock",
} as const;

export const FLAGS = {
  services: false,
  messaging: false,
  favorites: false,
} as const;
