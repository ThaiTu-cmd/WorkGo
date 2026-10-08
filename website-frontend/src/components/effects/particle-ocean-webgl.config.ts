/**
 * Particle Ocean WebGL Configuration & Constants
 * Light-tone cinematic animated background for landing/hero.
 */

export interface ParticleOceanConfig {
  particleCount: { cols: number; rows: number } | number; // default { cols: 400, rows: 250 } (~100k). number = tổng, auto chia theo aspect 8:5
  waveSpeed: number;        // default 0.35 — nhân uTime, slow hypnotic. range 0–1.5
  waveAmplitude: number;    // default 1.0 — scale Y displacement. range 0–2.5
  waveScale: number;        // default 0.055 — tần số không gian (nhân XZ). range 0.02–0.12
  particleSize: number;     // default 1.6 — base point size multiplier. range 0.5–4
  bokehStrength: number;    // default 1.0 — độ phóng đại + mờ hạt gần. range 0–2
  focusDistance: number;    // default 26.0 — khoảng cách focus mid-scene (world units). range 10–60
  colorNear: string;        // default '#2F6BFF' — hex, sóng gần (royal blue)
  colorDeep: string;        // default '#1747C9' — hex, đáy/khe sóng (cobalt)
  colorFar: string;         // default '#BFD8FF' — hex, sóng xa (pale sky blue)
  fogColor: string;         // default '#FFFFFF' — hex, fog/horizon
  bloomStrength: number;    // default 0 — 0 = OFF. Bật thử 0.25–0.45 nếu máy khỏe (cần three/addons)
  cameraHeight: number;     // default 6.0 — cao độ camera. range 3–10
  mouseParallax: boolean;   // default true — tắt auto trên touch
  pauseOffscreen: boolean;  // default true — IntersectionObserver + visibilitychange
}

export const DEFAULT_PARTICLE_OCEAN_CONFIG: Required<ParticleOceanConfig> = {
  particleCount: { cols: 400, rows: 250 },
  waveSpeed: 0.35,
  waveAmplitude: 1.0,
  waveScale: 0.055,
  particleSize: 1.6,
  bokehStrength: 1.0,
  focusDistance: 26.0,
  colorNear: '#2F6BFF',
  colorDeep: '#1747C9',
  colorFar: '#BFD8FF',
  fogColor: '#FFFFFF',
  bloomStrength: 0,
  cameraHeight: 6.0,
  mouseParallax: true,
  pauseOffscreen: true,
};

export const PARTICLE_OCEAN_PALETTE = {
  colorDeep: '#1747C9',
  colorNear: '#2F6BFF',
  colorFar: '#BFD8FF',
  fogColor: '#FFFFFF',
  textNavy: '#0B1B3F',
} as const;

export const WAVE_CONSTANTS = {
  w1: { dir: [1.0, 0.28], wavelength: 60, amplitude: 1.15, speed: 0.35, freq: 0.105 },
  w2: { dir: [-0.62, 1.0], wavelength: 31, amplitude: 0.55, speed: 0.50, freq: 0.203 },
  w3: { dir: [0.84, -0.66], wavelength: 17, amplitude: 0.28, speed: 0.72, freq: 0.370 },
  w4: { dir: [-0.24, -1.0], wavelength: 9, amplitude: 0.12, speed: 1.05, freq: 0.698 },
  noise: { freq: 0.02, speed: 0.06, weight: 0.9 },
} as const;

/**
 * Resolves particle count taking into account device capabilities and screen orientation.
 * - Mobile: cols <= 220, rows <= 140
 * - Low-end: cols <= 160, rows <= 100
 * - Portrait: reduces cols by 25%, retains rows
 */
export function resolveParticleCount(
  input: ParticleOceanConfig['particleCount'] = DEFAULT_PARTICLE_OCEAN_CONFIG.particleCount,
  opts?: { isMobile?: boolean; isLowEnd?: boolean; isPortrait?: boolean },
): { cols: number; rows: number } {
  let cols: number;
  let rows: number;

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || Number.isNaN(input)) {
      cols = 400;
      rows = 250;
    } else {
      const total = Math.max(100, input);
      rows = Math.max(10, Math.round(Math.sqrt(total / 1.6)));
      cols = Math.max(10, Math.round(rows * 1.6));
    }
  } else {
    cols = Math.max(10, input?.cols ?? 400);
    rows = Math.max(10, input?.rows ?? 250);
  }

  const isMobile = !!opts?.isMobile;
  const isLowEnd = !!opts?.isLowEnd;
  const isPortrait = !!opts?.isPortrait;

  if (isLowEnd) {
    cols = Math.min(cols, 160);
    rows = Math.min(rows, 100);
  } else if (isMobile) {
    cols = Math.min(cols, 220);
    rows = Math.min(rows, 140);
  }

  if (isPortrait) {
    cols = Math.max(10, Math.round(cols * 0.75));
  }

  return { cols, rows };
}

/**
 * Parses #RGB or #RRGGBB hex string to linear RGB [r, g, b] in range [0, 1].
 */
export function hexToLinear(h: string): [number, number, number] {
  let hex = (h || '').replace(/^#/, '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [1, 1, 1];
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return [toLinear(r), toLinear(g), toLinear(b)];
}
