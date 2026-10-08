/**
 * WORKGO DESIGN TOKENS
 * Single source of truth for color palette, semantic tokens, and visual styling.
 */

export const WORKGO_PALETTE = {
  deepNavy: '#030B1C',
  navy: '#06142F',
  darkBlue: '#0A1F4D',
  oceanBlue: '#0B4DBB',
  electricBlue: '#1677FF',
  brightBlue: '#2EA8FF',
  cyan: '#38BDF8',
  iceBlue: '#67D8FF',
  iceHighlight: '#DDF5FF',
  white: '#F8FCFF',
  lightBg: '#F5F9FF',
  lightSurface: '#FFFFFF',
  lightSecondary: '#EDF5FF',
} as const;

export type WorkGoColor = keyof typeof WORKGO_PALETTE;

export const SEMANTIC_TOKENS = {
  dark: {
    bgApp: WORKGO_PALETTE.deepNavy,
    bgSurface: WORKGO_PALETTE.navy,
    bgMuted: WORKGO_PALETTE.darkBlue,
    borderSubtle: 'rgba(103, 216, 255, 0.10)',
    borderDefault: 'rgba(148, 184, 255, 0.14)',
    borderStrong: 'rgba(148, 184, 255, 0.26)',
    textPrimary: WORKGO_PALETTE.white,
    textSecondary: '#B8CCF0',
    textMuted: '#7A8DB5',
    textDisabled: '#4A5A7E',
    primary: WORKGO_PALETTE.electricBlue,
    primaryHover: WORKGO_PALETTE.brightBlue,
    primaryActive: WORKGO_PALETTE.oceanBlue,
    primarySubtle: 'rgba(22, 119, 255, 0.14)',
    primaryInk: '#FFFFFF',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.12)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.12)',
    danger: '#EF4444',
    dangerHover: '#DC2626',
    dangerBg: 'rgba(239, 68, 68, 0.12)',
    info: WORKGO_PALETTE.cyan,
    infoBg: 'rgba(56, 189, 248, 0.12)',
  },
  light: {
    bgApp: WORKGO_PALETTE.lightBg,
    bgSurface: WORKGO_PALETTE.lightSurface,
    bgMuted: WORKGO_PALETTE.lightSecondary,
    borderSubtle: '#E4EEFB',
    borderDefault: '#D3E3F8',
    borderStrong: '#B9D2F2',
    textPrimary: WORKGO_PALETTE.navy,
    textSecondary: '#3D4E73',
    textMuted: '#7A8DB5',
    textDisabled: '#A9B8D4',
    primary: WORKGO_PALETTE.electricBlue,
    primaryHover: WORKGO_PALETTE.oceanBlue,
    primaryActive: '#0A2F7A',
    primarySubtle: '#E3EFFF',
    primaryInk: '#FFFFFF',
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.10)',
    warning: '#D97706',
    warningBg: 'rgba(217, 119, 6, 0.10)',
    danger: '#DC2626',
    dangerHover: '#B91C1C',
    dangerBg: 'rgba(220, 38, 38, 0.10)',
    info: '#0284C7',
    infoBg: 'rgba(2, 132, 199, 0.10)',
  },
} as const;

/**
 * Converts a hex color (#RRGGBB) to normalized linear RGB.
 */
export function hexToLinear(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
    return { r: 0, g: 0, b: 0 };
  }
  const bigint = parseInt(clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return {
    r: Number(toLinear(r).toFixed(4)),
    g: Number(toLinear(g).toFixed(4)),
    b: Number(toLinear(b).toFixed(4)),
  };
}

/**
 * Returns the CSS class for glassmorphism containers based on the variant.
 */
export function cxGlass(
  variant: 'default' | 'dark' | 'card' | 'panel' | 'dock' = 'default'
): string {
  switch (variant) {
    case 'dark':
      return 'glass-dark';
    case 'card':
      return 'glass-card';
    case 'panel':
      return 'glass-panel';
    case 'dock':
      return 'glass-dock';
    default:
      return 'glass';
  }
}
