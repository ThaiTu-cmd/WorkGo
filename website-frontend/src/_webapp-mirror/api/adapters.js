// Pure mappers: backend DTOs (identity / catalog / order-service) → the shapes
// the existing UI components render. Fields the backend does not expose yet
// come back empty so the matching section hides itself (see BACKEND_GAPS.md).

// Spring PageResponse lands either wrapped (ApiResponse.result) or bare.
export const pageItems = (res) => res?.result?.data ?? res?.data ?? [];

const TIERS = ['BASIC', 'STANDARD', 'PREMIUM'];

// Initial-letter avatar so no external image service is needed.
export const initialAvatar = (name) => {
  const letter = (String(name || '?').trim()[0] || '?').toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" fill="#1dbf73"/>` +
    `<text x="50%" y="54%" font-family="sans-serif" font-size="44" fill="#fff" ` +
    `text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Neutral 3:2 cover for a service without uploaded images: the title's initial
// on a brand gradient, instead of a random stock photo that looks real.
export const placeholderCover = (title) => {
  const letter = (String(title || '?').trim()[0] || '?').toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#0f5132"/><stop offset="1" stop-color="#1dbf73"/></linearGradient></defs>` +
    `<rect width="1200" height="800" fill="url(#g)"/>` +
    `<text x="50%" y="53%" font-family="sans-serif" font-size="300" font-weight="700" fill="#ffffff" fill-opacity="0.9" ` +
    `text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const toNumber = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));
// Instant as ISO string or epoch number → ms (0 when missing).
const timeOf = (v) => (typeof v === 'number' ? v : Date.parse(v ?? '') || 0);

// PackageResponse[] → sidebar/comparison packages, cheapest = BASIC.
export const toPackages = (packages = []) =>
  [...packages]
    .filter((p) => !p.packageStatus || p.packageStatus === 'ACTIVE')
    // Equal prices fall back to creation order (Basic is created first).
    .sort((a, b) => toNumber(a.price) - toNumber(b.price) || timeOf(a.createdAt) - timeOf(b.createdAt))
    .slice(0, 3)
    .map((p, i) => ({
      id: p.packageId,
      tier: TIERS[i],
      name: p.name,
      description: p.description || '',
      price: toNumber(p.price),
      currency: p.currency,
      deliveryDays: p.deliveryDay ?? null,
      durationMinute: p.durationMinute ?? null,
      revisionLimit: p.revisionLimit ?? 0,
      features: [],
    }));

// Add-ons without an id can't be ordered (older catalog builds returned
// addOnId: null), so they are left out rather than sent as null.
export const toAddons = (addons = []) =>
  addons
    .filter((a) => a.addOnId && (!a.status || a.status === 'ACTIVE'))
    .map((a) => ({
      id: a.addOnId,
      name: a.name,
      description: a.description || '',
      price: toNumber(a.price),
    }));

// Cover image first, then the rest in server order.
export const toMediaList = (medias = [], title = '') =>
  medias
    .filter((m) => m.url && (!m.mediaType || m.mediaType === 'IMAGE'))
    .sort((a, b) => Number(Boolean(b.cover)) - Number(Boolean(a.cover)))
    .map((m, i) => ({ id: m.serviceMediaId, url: m.url, isCover: i === 0, alt: title }));

// Provider profiles registered in identity_db (fallback when unauthenticated)
export const DB_PROVIDERS = {
  '99999999-9999-9999-9999-999999999999': {
    providerProfileId: '99999999-9999-9999-9999-999999999999',
    businessName: 'Văn A Studio',
    verificationStatus: 'VERIFIED',
    bio: 'Chuyên thiết kế website & giải pháp thương hiệu chuyên nghiệp.',
  },
  '88888888-8888-8888-8888-888888888888': {
    providerProfileId: '88888888-8888-8888-8888-888888888888',
    businessName: 'B Media',
    verificationStatus: 'VERIFIED',
    bio: 'Đại lý truyền thông, quảng cáo đa kênh và dịch vụ số 1.',
  },
};

export const toProvider = (profile, fallbackProviderId = null) => {
  const providerId = profile?.providerProfileId || fallbackProviderId;
  const known = providerId ? DB_PROVIDERS[providerId] : null;
  const hasRealProfile = Boolean(profile?.businessName || profile?.bio || profile?.verificationStatus);
  const name = profile?.businessName || known?.businessName || 'Nhà cung cấp';
  const isVerified = (profile?.verificationStatus || known?.verificationStatus) === 'VERIFIED';
  const source = hasRealProfile ? 'real' : (known ? 'fallback' : 'mock');
  return {
    providerId: providerId ?? null,
    name,
    avatar: initialAvatar(name),
    isVerified,
    level: null,
    badge: isVerified ? 'Đã xác thực' : null,
    bio: profile?.bio || known?.bio || '',
    providerType: profile?.providerType ?? null,
    verificationStatus: profile?.verificationStatus || known?.verificationStatus || null,
    joinedAt: profile?.joinedAt ?? null,
    source,
  };
};

// Fastest delivery among a service's ACTIVE packages, in days. Only DIGITAL
// work has a delivery time (ONSITE packages store 0 / null), so no positive
// value means "not applicable" → null.
export const fastestDeliveryDays = (packages = []) => {
  const days = packages
    .filter((p) => !p.packageStatus || p.packageStatus === 'ACTIVE')
    .map((p) => Number(p.deliveryDay))
    .filter((d) => Number.isFinite(d) && d > 0);
  return days.length ? Math.min(...days) : null;
};

// ServiceResponse (list endpoint) → ServiceCard item used by CatalogSearch and
// PopularServices. `provider` is the ProviderProfileResponse when known;
// `packages` (PackageResponse[]) fills deliveryDays and `medias`
// (ServiceMediaResponse[]) the cover image when given.
export const toServiceCard = (dto, { category = null, provider = null, packages = null, medias = null } = {}) => {
  const providerView = toProvider(provider, dto.providerId);
  const realCover = dto.coverImage || toMediaList(medias || [])[0]?.url || null;
  const hasRealCover = Boolean(realCover);
  const coverImage = realCover || placeholderCover(dto.title);
  return {
    serviceId: dto.serviceId,
    providerId: dto.providerId,
    categoryId: dto.categoryId,
    categorySlug: category?.slug ?? null,
    categoryName: category?.name ?? '',
    title: dto.title,
    slug: dto.slug,
    executionType: dto.executionType,
    coverImage,
    imageSource: hasRealCover ? 'real' : 'placeholder',
    provider: providerView,
    providerSource: providerView.source,
    avgRating: toNumber(dto.avgRating),
    reviewCount: toNumber(dto.reviewCount),
    orderCount: toNumber(dto.orderCount),
    basePrice: toNumber(dto.basePrice),
    deliveryDays: packages ? fastestDeliveryDays(packages) : null,
    createdAt: dto.createdAt,
  };
};

// ServiceResponse + related lists → ServiceDetailPage `service` object.
export const toServiceDetail = ({ service, packages = [], addons = [], medias = [], provider = null, category = null }) => {
  const providerView = toProvider(provider, service.providerId);
  const mediaList = toMediaList(medias, service.title);
  const pkgs = toPackages(packages);
  const hasRealMedia = mediaList.length > 0 || Boolean(service.coverImage);
  const coverUrl = mediaList[0]?.url || service.coverImage || placeholderCover(service.title);
  const fullMediaList = mediaList.length > 0 ? mediaList : [
    { id: 'cover-1', url: coverUrl, isCover: true, alt: service.title, source: hasRealMedia ? 'real' : 'placeholder' },
  ];
  return {
    serviceId: service.serviceId,
    providerId: service.providerId,
    categoryId: service.categoryId,
    categorySlug: category?.slug ?? null,
    categoryName: category?.name ?? 'Dịch vụ',
    title: service.title,
    slug: service.slug,
    description: service.description || '',
    executionType: service.executionType,
    status: service.status,
    currency: service.currency,
    coverImage: coverUrl,
    imageSource: hasRealMedia ? 'real' : 'placeholder',
    basePrice: pkgs[0]?.price ?? toNumber(service.basePrice),
    provider: providerView,
    providerSource: providerView.source,
    avgRating: toNumber(service.reviewCount) > 0 ? toNumber(service.avgRating) : null,
    reviewCount: toNumber(service.reviewCount),
    orderCount: toNumber(service.orderCount),
    ordersInQueue: null,
    mediaList: fullMediaList,
    packages: pkgs,
    comparisonMatrix: [],
    sellerBio: providerView.bio,
    // No backend source for these yet: null / empty hides the matching row
    // instead of showing made-up values.
    responseTime: null,
    lastDelivery: null,
    memberSince: providerView.joinedAt ? new Date(providerView.joinedAt).getFullYear() : null,
    languages: [],
    faqs: [],
    reviews: [],
    addons: toAddons(addons),
  };
};

const formatVnd = (n) => `${new Intl.NumberFormat('vi-VN').format(n)} ₫`;

// catalog ServiceStatus (DRAFT | PUBLISHED | PAUSED | ARCHIVED) → MyServices tabs.
const ROW_STATUS = { PUBLISHED: 'ACTIVE', ARCHIVED: 'PAUSED' };
export const toRowStatus = (serviceStatus) => ROW_STATUS[serviceStatus] ?? serviceStatus;
// MyServices tab status → catalog ServiceStatus.
export const toServiceStatus = (rowStatus) => (rowStatus === 'ACTIVE' ? 'PUBLISHED' : rowStatus);

// ServiceResponse (+ optional packages) → MyServices table row.
export const toMyServiceRow = (service, packages = [], category = null) => {
  const prices = packages.map((p) => toNumber(p.price)).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : toNumber(service.basePrice);
  const max = prices.length ? Math.max(...prices) : min;
  let priceRange = null;
  if (prices.length) priceRange = min === max ? formatVnd(min) : `${formatVnd(min)} – ${formatVnd(max)}`;
  return {
    serviceId: service.serviceId,
    title: service.title,
    slug: service.slug,
    description: service.description || '',
    categoryId: service.categoryId,
    categoryName: category?.name ?? '',
    categorySlug: category?.slug ?? '',
    executionType: service.executionType,
    status: toRowStatus(service.status),
    coverImage: initialAvatar(service.title),
    basePrice: min,
    priceRange,
    packagesCount: packages.length,
    impressions: null,
    ordersCount: toNumber(service.orderCount),
    avgRating: toNumber(service.avgRating),
    reviewCount: toNumber(service.reviewCount),
    createdAt: service.createdAt,
  };
};

// AddressResponse → AddressBook card.
export const toAddress = (dto) => ({
  id: dto.addressId,
  label: dto.label || '',
  receiver: dto.contactName || '',
  phone: dto.contactPhone || '',
  line1: dto.line1 || '',
  ward: dto.ward || '',
  district: dto.district || '',
  city: dto.city || '',
  note: dto.note || '',
  detail: [dto.line1, dto.ward, dto.district, dto.city].filter(Boolean).join(', '),
});

// AddressBook form → AddressCreationRequest / AddressUpdateRequest.
// PUT overwrites every column (nulls included), so always send the full record.
export const fromAddressForm = (form) => ({
  label: form.label,
  contactName: form.receiver,
  contactPhone: form.phone,
  line1: form.line1,
  ward: form.ward || null,
  district: form.district || null,
  city: form.city || null,
  note: form.note || null,
  countryCode: 'VN',
});

// Backend keeps first/last name apart; the UI shows one "Họ và tên" field.
// Vietnamese order: the last word is the given name (firstName).
export const splitFullName = (fullName) => {
  const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { firstName: words[0] || '', lastName: '' };
  return { firstName: words[words.length - 1], lastName: words.slice(0, -1).join(' ') };
};

export const joinFullName = (user) =>
  [user?.lastName, user?.firstName].filter(Boolean).join(' ').trim() || user?.userName || '';
