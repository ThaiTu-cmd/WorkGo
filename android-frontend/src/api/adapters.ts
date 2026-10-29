// Pure mappers: backend DTOs (identity / catalog / order-service) → the shapes
// the screens render. Ported from website-frontend/src/_webapp-mirror/api/adapters.js;
// fields the backend does not expose yet are left out.
import type { AddonDto, AddressDto, CategoryDto, MediaDto, PackageDto, ProviderProfileDto, ServiceDto } from './types';

// Spring PageResponse lands either wrapped (ApiResponse.result) or bare.
export function pageItems<T>(res: unknown): T[] {
  const r = res as { result?: { data?: T[] }; data?: T[] } | null | undefined;
  return r?.result?.data ?? r?.data ?? [];
}

const toNumber = (v: unknown): number => (v === null || v === undefined || v === '' ? 0 : Number(v));

const TIERS = ['BASIC', 'STANDARD', 'PREMIUM'] as const;

export type Package = {
  id: string;
  tier: (typeof TIERS)[number];
  name: string;
  description: string;
  price: number;
  currency?: string;
  deliveryDays: number | null;
  durationMinute: number | null;
  revisionLimit: number;
};

export type Addon = { id: string; name: string; description: string; price: number };

export type Media = { id: string; url: string; isCover: boolean };

export type Provider = {
  providerId: string | null;
  name: string;
  isVerified: boolean;
  bio: string;
  providerType: string | null;
  verificationStatus: string | null;
  joinedAt: string | null;
};

export type ServiceCard = {
  serviceId: string;
  providerId: string;
  categoryId: string;
  categoryName: string;
  title: string;
  executionType: ServiceDto['executionType'];
  provider: Provider;
  avgRating: number;
  reviewCount: number;
  orderCount: number;
  basePrice: number;
  createdAt?: string;
};

export type ServiceDetail = Omit<ServiceCard, 'avgRating'> & {
  slug?: string;
  description: string;
  status?: ServiceDto['status'];
  currency?: string;
  coverImage: string | null;
  // 0 rating with no reviews means "not rated yet" → null hides the stars.
  avgRating: number | null;
  mediaList: Media[];
  packages: Package[];
  addons: Addon[];
};

// PackageResponse[] → package picker, cheapest = BASIC.
export function toPackages(packages: PackageDto[] = []): Package[] {
  return [...packages]
    .filter((p) => !p.packageStatus || p.packageStatus === 'ACTIVE')
    .sort((a, b) => toNumber(a.price) - toNumber(b.price))
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
    }));
}

// Add-ons without an id can't be ordered (older catalog builds returned
// addOnId: null), so they are left out rather than sent as null.
export function toAddons(addons: AddonDto[] = []): Addon[] {
  return addons
    .filter((a): a is AddonDto & { addOnId: string } => Boolean(a.addOnId) && (!a.status || a.status === 'ACTIVE'))
    .map((a) => ({ id: a.addOnId, name: a.name, description: a.description || '', price: toNumber(a.price) }));
}

// Cover image first, then the rest in server order.
export function toMediaList(medias: MediaDto[] = []): Media[] {
  return medias
    .filter((m) => m.url && (!m.mediaType || m.mediaType === 'IMAGE'))
    .sort((a, b) => Number(Boolean(b.cover)) - Number(Boolean(a.cover)))
    .map((m, i) => ({ id: m.serviceMediaId, url: m.url, isCover: i === 0 }));
}

export function toProvider(profile: ProviderProfileDto | null | undefined): Provider {
  return {
    providerId: profile?.providerProfileId ?? null,
    name: profile?.businessName || 'Nhà cung cấp',
    isVerified: profile?.verificationStatus === 'VERIFIED',
    bio: profile?.bio || '',
    providerType: profile?.providerType ?? null,
    verificationStatus: profile?.verificationStatus ?? null,
    joinedAt: profile?.joinedAt ?? null,
  };
}

type Related = { category?: CategoryDto | null; provider?: ProviderProfileDto | null };

export function toServiceCard(dto: ServiceDto, { category = null, provider = null }: Related = {}): ServiceCard {
  return {
    serviceId: dto.serviceId,
    providerId: dto.providerId,
    categoryId: dto.categoryId,
    categoryName: category?.name ?? '',
    title: dto.title,
    executionType: dto.executionType,
    provider: toProvider(provider),
    avgRating: toNumber(dto.avgRating),
    reviewCount: toNumber(dto.reviewCount),
    orderCount: toNumber(dto.orderCount),
    basePrice: toNumber(dto.basePrice),
    createdAt: dto.createdAt,
  };
}

export function toServiceDetail({
  service,
  packages = [],
  addons = [],
  medias = [],
  provider = null,
  category = null,
}: Related & { service: ServiceDto; packages?: PackageDto[]; addons?: AddonDto[]; medias?: MediaDto[] }): ServiceDetail {
  const card = toServiceCard(service, { category, provider });
  const mediaList = toMediaList(medias);
  const pkgs = toPackages(packages);
  return {
    ...card,
    categoryName: category?.name ?? 'Dịch vụ',
    slug: service.slug,
    description: service.description || '',
    status: service.status,
    currency: service.currency,
    coverImage: mediaList[0]?.url ?? null,
    basePrice: pkgs[0]?.price ?? card.basePrice,
    avgRating: card.reviewCount > 0 ? card.avgRating : null,
    mediaList,
    packages: pkgs,
    addons: toAddons(addons),
  };
}

// catalog ServiceStatus → My services tabs (ACTIVE = published).
export type RowStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED';
export const toRowStatus = (status: ServiceDto['status']): RowStatus =>
  status === 'PUBLISHED' ? 'ACTIVE' : status === 'DRAFT' ? 'DRAFT' : 'PAUSED';

export type MyServiceRow = {
  serviceId: string;
  title: string;
  categoryId: string;
  executionType: ServiceDto['executionType'];
  status: RowStatus;
  basePrice: number;
  maxPrice: number;
  packagesCount: number;
  ordersCount: number;
  avgRating: number;
  reviewCount: number;
};

export function toMyServiceRow(service: ServiceDto, packages: PackageDto[] = []): MyServiceRow {
  const prices = packages.map((p) => toNumber(p.price)).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : toNumber(service.basePrice);
  return {
    serviceId: service.serviceId,
    title: service.title,
    categoryId: service.categoryId,
    executionType: service.executionType,
    status: toRowStatus(service.status),
    basePrice: min,
    maxPrice: prices.length ? Math.max(...prices) : min,
    packagesCount: packages.length,
    ordersCount: toNumber(service.orderCount),
    avgRating: toNumber(service.avgRating),
    reviewCount: toNumber(service.reviewCount),
  };
}

export type Address = {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  city: string;
  note: string;
  detail: string;
};

export type AddressForm = Omit<Address, 'id' | 'detail'>;

export function toAddress(dto: AddressDto): Address {
  return {
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
  };
}

// Address form → AddressCreationRequest / AddressUpdateRequest.
// PUT overwrites every column (nulls included), so always send the full record.
export function fromAddressForm(form: AddressForm) {
  return {
    label: form.label,
    contactName: form.receiver,
    contactPhone: form.phone,
    line1: form.line1,
    ward: form.ward || null,
    district: form.district || null,
    city: form.city || null,
    note: form.note || null,
    countryCode: 'VN',
  };
}

// Backend keeps first/last name apart; the UI shows one "Họ và tên" field.
// Vietnamese order: the last word is the given name (firstName).
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { firstName: words[0] || '', lastName: '' };
  return { firstName: words[words.length - 1], lastName: words.slice(0, -1).join(' ') };
}

export function joinFullName(user: { firstName?: string | null; lastName?: string | null; userName?: string } | null | undefined): string {
  return [user?.lastName, user?.firstName].filter(Boolean).join(' ').trim() || user?.userName || '';
}
