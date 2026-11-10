const vnd = new Intl.NumberFormat('vi-VN');

export function formatVnd(n: number): string {
  return `${vnd.format(n)} ₫`;
}

const pad = (n: number) => String(n).padStart(2, '0');

// dd/MM/yyyy HH:mm in the device's time zone.
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// dd/MM/yyyy only.
export function formatDate(iso: string | null | undefined): string {
  return formatDateTime(iso).slice(0, 10);
}
