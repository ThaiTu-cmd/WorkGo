export const FIVERR_DENSITY = {
  high: 300,
  low: 150,
  memThresholdGb: 4,
  cpuThreshold: 4,
} as const;

export function resolveParticleDensity(fallback: number = FIVERR_DENSITY.high): number {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return fallback;
    }
    const nav = navigator as Navigator & { deviceMemory?: number };
    const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
    const cpu =
      typeof nav.hardwareConcurrency === "number"
        ? nav.hardwareConcurrency
        : undefined;
    const narrow =
      typeof window.innerWidth === "number" && window.innerWidth < 768;

    if (
      (mem !== undefined && mem <= FIVERR_DENSITY.memThresholdGb) ||
      (cpu !== undefined && cpu <= FIVERR_DENSITY.cpuThreshold) ||
      narrow
    ) {
      return FIVERR_DENSITY.low;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
