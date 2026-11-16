// F1: pure form-validation helpers (React-free so node:test can import directly).
// All messages are Vietnamese, per-field, no generic fallback.

export const TITLE_MIN = 15;
export const TITLE_MAX = 100;
export const DESC_MIN = 20;
export const PRICE_MIN = 50000;
export const PRICE_MAX = 100000000;

export function stripHtmlTags(s) {
  return String(s ?? '').replace(/<[^>]*>/g, '');
}

export function sanitizeText(s) {
  return stripHtmlTags(s).replace(/\s+/g, ' ').trim();
}

export function validateTitle(raw) {
  const text = sanitizeText(raw);
  if (text.length < TITLE_MIN) {
    return `Vui lòng nhập tiêu đề từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự!`;
  }
  if (text.length > TITLE_MAX) {
    return `Tiêu đề quá dài (${text.length}/${TITLE_MAX} ký tự) — vui lòng rút gọn!`;
  }
  return null;
}

export function validateDescription(raw) {
  const text = sanitizeText(raw);
  if (text.length < DESC_MIN) {
    return `Vui lòng nhập mô tả chi tiết từ ${DESC_MIN} ký tự trở lên!`;
  }
  return null;
}

export function validatePrice(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Giá gói phải là số lớn hơn 0!';
  }
  if (value < PRICE_MIN) {
    return `Giá tối thiểu là ${PRICE_MIN.toLocaleString('vi-VN')} ₫!`;
  }
  if (value > PRICE_MAX) {
    return `Giá vượt quá ${PRICE_MAX.toLocaleString('vi-VN')} ₫ cho phép!`;
  }
  return null;
}

// Every package needs a valid price, and Basic < Standard < Premium: the backend
// has no tier column, so tiers are read back by price order when the service is
// shown or edited (equal or reversed prices would swap the packages).
const TIER_LABELS = { basic: 'Cơ bản', standard: 'Tiêu chuẩn', premium: 'Cao cấp' };
export function validatePackagePrices(packages = {}) {
  for (const tier of ['basic', 'standard', 'premium']) {
    const err = validatePrice(packages[tier]?.price);
    if (err) return `Gói ${TIER_LABELS[tier]}: ${err}`;
  }
  const [b, s, p] = ['basic', 'standard', 'premium'].map((t) => Number(packages[t].price));
  if (!(b < s && s < p)) {
    return 'Giá các gói phải tăng dần: Cơ bản < Tiêu chuẩn < Cao cấp!';
  }
  return null;
}

// Add-ons are optional, but each one listed needs a name and a positive price.
export function validateAddons(addons = []) {
  for (const [i, addon] of addons.entries()) {
    if (sanitizeText(addon.name).length < 3) {
      return `Add-on #${i + 1}: vui lòng nhập tên từ 3 ký tự trở lên!`;
    }
    const price = Number(addon.price);
    if (!Number.isFinite(price) || price <= 0) {
      return `Add-on #${i + 1}: giá phải là số lớn hơn 0!`;
    }
    if (price > PRICE_MAX) {
      return `Add-on #${i + 1}: giá vượt quá ${PRICE_MAX.toLocaleString('vi-VN')} ₫ cho phép!`;
    }
  }
  return null;
}

export const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value ?? '').trim());

export function clampPrice(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > PRICE_MAX) return PRICE_MAX;
  return value;
}
