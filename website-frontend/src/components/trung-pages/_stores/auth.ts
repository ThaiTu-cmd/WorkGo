"use client";

import { KEYS } from "./keys";

/**
 * Cycle 4 — single source of truth for the (mock) auth session.
 *
 * Contract shared with the web-app AuthModal copy (which writes it inline
 * because it must stay byte-identical in both app trees):
 *   localStorage["accessToken"]     → KEYS.authToken (pinned, do not rename)
 *   localStorage["workgo_auth_user"]→ JSON { name, email }
 *   window "workgo-auth-changed"    → event the axios client + data hooks already listen to
 */
export const AUTH_EVENT = "workgo-auth-changed";
export const AUTH_USER_KEY = "workgo_auth_user";

export type AuthUser = { name: string; email: string };

function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEYS.authToken);
  } catch {
    return null;
  }
}

export function readAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const user = parsed as { name?: unknown; email?: unknown };
    if (typeof user.name !== "string" || typeof user.email !== "string") return null;
    return { name: user.name, email: user.email };
  } catch {
    return null;
  }
}

/** Persist the mock session. Returns false when storage is blocked/quota-full. */
export function saveAuth(user: AuthUser): boolean {
  let ok = true;
  try {
    window.localStorage.setItem(KEYS.authToken, `mock-token-${Date.now()}`);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    ok = false;
  }
  notifyAuthChanged();
  return ok;
}

export function clearAuth(): void {
  try {
    window.localStorage.removeItem(KEYS.authToken);
    window.localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // storage blocked — nothing to clear
  }
  notifyAuthChanged();
}

/** Subscribe to same-tab and cross-tab auth changes. Returns an unsubscribe fn. */
export function subscribeAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
