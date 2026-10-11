/**
 * FIVERR-INSPIRED MARKETPLACE LANDING — measured design tokens.
 *
 * Every value below was read directly from the reference site's computed styles
 * at 1440 / 1024 / 390 viewport widths (see `.team/PLAN.md` §1.2.1–§1.2.3).
 * The reference site uses proprietary typefaces (Macan / DomaineDisplay) which
 * WorkGo cannot ship; typography is served by Be Vietnam Pro + Instrument Serif.
 * Colours, geometry and motion are reproduced exactly.
 */

export const FIVERR_COLOR = {
  ink900: '#222325',
  ink700: '#404145',
  ink500: '#62646A',
  hairline: '#DADBDD',
  fieldBorder: '#C5C6C9',
  btnDark: '#222325',
  btnSearch: '#404145',
  chipGlass: 'rgba(255, 255, 255, 0.1)',
  chipGlassBorder: '#FFFFFF',
  cardGreen: '#003912',
  cardGreenBright: '#00732E',
  panelBrown: '#421300',
  panelPlum: '#4D1727',
  accent: '#FF7640',
  brand: '#1DBF73',
} as const;

export const FIVERR_RADIUS = {
  chip: 8,
  card: 16,
  input: 12,
  media: 4,
  pill: 9999,
} as const;

export const FIVERR_SHADOW = {
  card: '0 0 0.88px rgba(0,0,0,0.027), 0 0 2.29px rgba(0,0,0,0.03), 0 0 5.52px rgba(0,0,0,0.055), 0 0 11px rgba(0,0,0,0.09)',
  pop: '0 3px 10px rgba(0,0,0,0.13)',
} as const;

/** Breakpoints đo được từ fiverr.com */
export const FIVERR_TYPE_SCALE = {
  h1:      { desktop: '72px', tablet: '72px',  mobile: '32px', weight: 280, lh: 1.2,  ls: '-0.06em' },
  h2Large: { desktop: '48px', tablet: '48px',  mobile: '32px', weight: 400, lh: 1.05, ls: '-0.03em' },
  h2Mid:   { desktop: '40px', tablet: '40px',  mobile: '32px', weight: 400, lh: 1.2,  ls: '-0.03em' },
  h2Panel: { desktop: '52px', tablet: '36px',  mobile: '32px', weight: 280, lh: 1.06, ls: '-0.06em' },
  h2Cta:   { desktop: '64px', tablet: '64px',  mobile: '40px', weight: 400, lh: 1.03, ls: '-0.02em' },
  h3:      { desktop: '18px', tablet: '18px',  mobile: '18px', weight: 700, lh: 1.55, ls: 'normal' },
  body:    { desktop: '16px', tablet: '16px',  mobile: '16px', weight: 400, lh: 1.5,  ls: 'normal' },
  link:    { desktop: '14px', tablet: '14px',  mobile: '14px', weight: 400, lh: 1.57, ls: 'normal' },
} as const;

/** Khoảng cách đo được (px) */
export const FIVERR_SPACE = {
  pageGutter: { desktop: 32, mobile: 24 },
  sectionY: 40,
  pageBottom: 80,
  heroHeight: { desktop: 680, mobile: 450 },
  heroPadTop: { desktop: 176, tablet: 120, mobile: 64 },
  gapHeadingToGrid: 32,
} as const;

export const FIVERR_MOTION = {
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  durFast: 150,
  durMed: 300,
  durSlow: 620,
  stagger: 80,
} as const;

export const FIVERR_HIT = {
  btnH: 42,
  chipH: 42,
  heroSearchH: { mobile: 52, desktop: 60 },
  headerH: 64,
} as const;

export type FiverrColorToken = keyof typeof FIVERR_COLOR;
export type FiverrTypeToken = keyof typeof FIVERR_TYPE_SCALE;