// C2-5: persistence for provider services (mock-backed demo data).
// Schema: full-array snapshot under a single key. The mock list is tiny
// (a few KB), so a whole-array snapshot is simpler and more robust than
// per-id overrides + tombstones: toggle/bulk/duplicate/delete/create all
// survive reload with one code path. localStorage is best-effort — every
// read/write is guarded (private mode, quota, corrupt JSON fall back to
// the bundled mocks, never crash).
import { mockProviderServices } from '../../data/mockProviderServices';

export const PROVIDER_SERVICES_STORAGE_KEY = 'workgo_provider_services_overrides';

// R2: in-memory fallback for the session when localStorage is unavailable
// (private mode) or refuses the write (quota). Keeps the current session's
// edits alive even though they cannot survive a reload.
let memoryCache = null;
let lastFailureReason = null;

function describeFailure(err) {
  if (!err) return 'unknown';
  if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) return 'quota';
  if (err.name === 'SecurityError') return 'private-mode';
  return 'unavailable';
}

function isValidServiceList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (s) => s && typeof s === 'object' && typeof s.serviceId === 'string'
    )
  );
}

export function loadPersistedProviderServices() {
  try {
    if (typeof localStorage === 'undefined') return memoryCache;
    const raw = localStorage.getItem(PROVIDER_SERVICES_STORAGE_KEY);
    if (!raw) return memoryCache;
    const parsed = JSON.parse(raw);
    return isValidServiceList(parsed) ? parsed : memoryCache;
  } catch {
    return memoryCache;
  }
}

export function persistProviderServices(services) {
  try {
    if (typeof localStorage === 'undefined') throw new DOMException('no localStorage', 'SecurityError');
    localStorage.setItem(PROVIDER_SERVICES_STORAGE_KEY, JSON.stringify(services));
    lastFailureReason = null;
    return true;
  } catch (err) {
    memoryCache = services;
    lastFailureReason = describeFailure(err);
    return false;
  }
}

export function getPersistFailureReason() {
  return lastFailureReason;
}

export function clearPersistedProviderServices() {
  memoryCache = null;
  lastFailureReason = null;
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PROVIDER_SERVICES_STORAGE_KEY);
  } catch {
    // best-effort only
  }
}

// Initial state for MyServicesPage internal store: persisted snapshot wins,
// bundled mocks are the fallback. External (bridge) callers pass their own
// list; the shell mirrors this same lazy-init (see webapp-shell.tsx).
export function initialProviderServices() {
  return loadPersistedProviderServices() || mockProviderServices;
}
