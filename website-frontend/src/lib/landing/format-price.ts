export const VND_PER_USD = 25000;

export function formatPriceVND(vnd: number, locale: string): string {
  if (locale === "vi") {
    return (
      "Từ " +
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(vnd)
    );
  }
  const usd = Math.max(1, Math.round(vnd / VND_PER_USD));
  return (
    "From " +
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(usd)
  );
}
