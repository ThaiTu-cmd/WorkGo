const timeFmt = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const dayDiff = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((start(today) - start(d)) / 86_400_000);
};

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

export const formatDay = (iso: string) => {
  const diff = dayDiff(iso);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  return dateFmt.format(new Date(iso));
};

// List timestamp: time today, "Hôm qua", else the date.
export const formatListTime = (iso: string) => (dayDiff(iso) === 0 ? formatTime(iso) : formatDay(iso));

// Vietnamese names put the given name last: "Nguyễn Minh Anh" → "A".
export const initialOf = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? "?").toUpperCase();
};

const AVATAR_COLORS = ["#1dbf73", "#0ea5e9", "#8b5cf6", "#f97316", "#e11d48", "#0d9488"];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

export const ROLE_LABEL = { CLIENT: "Khách hàng", PROVIDER: "Chuyên gia" } as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã bàn giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};
