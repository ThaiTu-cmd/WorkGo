export function formatVND(amount: number, locale = "vi"): string {
  if (locale === "vi") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(dateStringOrTimestamp?: string | number | Date | null, locale = "vi"): string {
  if (!dateStringOrTimestamp) return "—";
  const date = new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function formatDateOnly(dateStringOrTimestamp?: string | number | Date | null, locale = "vi"): string {
  if (!dateStringOrTimestamp) return "—";
  const date = new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
