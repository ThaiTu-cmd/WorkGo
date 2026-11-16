// Lower-case and strip Vietnamese diacritics so "sua may" finds "Sửa máy".
export const fold = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

// Search box filter for the catalog list: title, category or provider name.
export function matchesSearch(service, query) {
  const q = fold(query);
  if (!q) return true;
  return [service.title, service.categoryName, service.provider?.name].some((field) => fold(field).includes(q));
}
