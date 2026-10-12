export interface ExecPair {
  bg: string;
  fg: string;
  border: string;
}

export interface ExecEntry {
  label: string;
  light: ExecPair;
  dark: ExecPair;
}

export const EXEC_CONFIG: Record<
  'DIGITAL' | 'ONSITE' | 'DELIVERY' | 'APPOINTMENT' | 'HOURLY' | 'PROJECT',
  ExecEntry
> = {
  DIGITAL: {
    label: 'Kỹ thuật số',
    light: { bg: '#E0F2FE', fg: '#0369A1', border: '#BAE6FD' },
    dark: { bg: '#0C2A4A', fg: '#7DD3FC', border: '#164E7A' },
  },
  ONSITE: {
    label: 'Tại chỗ',
    light: { bg: '#FEF3C7', fg: '#B45309', border: '#FDE68A' },
    dark: { bg: '#3A2503', fg: '#FCD34D', border: '#7A5410' },
  },
  DELIVERY: {
    label: 'Giao hàng',
    light: { bg: '#DCFCE7', fg: '#15803D', border: '#BBF7D0' },
    dark: { bg: '#052E1B', fg: '#6EE7B7', border: '#166534' },
  },
  APPOINTMENT: {
    label: 'Đặt hẹn',
    light: { bg: '#F3E8FF', fg: '#7C3AED', border: '#DDD6FE' },
    dark: { bg: '#2A1650', fg: '#C4B5FD', border: '#5B21B6' },
  },
  HOURLY: {
    label: 'Theo giờ',
    light: { bg: '#E0F2FE', fg: '#0369A1', border: '#BAE6FD' },
    dark: { bg: '#0C2A4A', fg: '#7DD3FC', border: '#164E7A' },
  },
  PROJECT: {
    label: 'Dự án',
    light: { bg: '#E0F2FE', fg: '#0369A1', border: '#BAE6FD' },
    dark: { bg: '#0C2A4A', fg: '#7DD3FC', border: '#164E7A' },
  },
};

export function getExecStyle(type: string, isDark: boolean) {
  const entry = (EXEC_CONFIG as Record<string, ExecEntry>)[type] ?? EXEC_CONFIG.DIGITAL;
  const pair = isDark ? entry.dark : entry.light;
  return {
    label: entry.label,
    bg: pair.bg,
    fg: pair.fg,
    border: pair.border,
  };
}
