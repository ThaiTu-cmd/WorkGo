// Pure helpers that turn the service form into catalog package / add-on / media
// calls (React-free so node:test can import them directly).
import { clampPrice, sanitizeText } from './formValidation.js';

const clean = (s) => String(s ?? '').trim();

// ONSITE packages: minutes of work per visit (PackageRequest.durationMinute).
export const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240, 360, 480];
export const DEFAULT_MINUTES = { basic: 60, standard: 120, premium: 240 };

// '3 lần' → 3; 'Không giới hạn' / 'Unlimited' → null (unlimited).
export const parseRevisions = (rev) => {
  const n = parseInt(String(rev ?? ''), 10);
  return Number.isFinite(n) ? n : null;
};

// One form package → PackageCreationRequest / PackageUpdateRequest. DIGITAL work
// has a delivery time in days, ONSITE work a duration in minutes; the other
// field is sent as null (PUT overwrites every column).
export function toPackageBody(pkg, executionType, tier) {
  const onsite = executionType === 'ONSITE';
  const positiveInt = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  };
  return {
    name: sanitizeText(pkg.title),
    description: sanitizeText(pkg.desc),
    price: clampPrice(pkg.price),
    currency: 'VND',
    deliveryDay: onsite ? null : positiveInt(pkg.days),
    durationMinute: onsite ? positiveInt(pkg.minutes) ?? DEFAULT_MINUTES[tier] ?? null : null,
    revisionLimit: parseRevisions(pkg.rev),
  };
}

// AddOnResponse[] → editable form rows.
export const addonsToForm = (addons = []) =>
  addons
    .filter((a) => a.addOnId)
    .map((a) => ({ id: a.addOnId, name: a.name || '', desc: a.description || '', price: Number(a.price) || 0 }));

// Which add-ons to create, update or delete. Rows keep their server id; ids that
// were loaded but are no longer in the form were removed by the provider.
export const toAddonBody = (a) => ({ name: clean(a.name), description: clean(a.desc), price: Number(a.price) || 0, currency: 'VND' });

export function planAddonChanges(originalIds = [], addons = []) {
  const keptIds = new Set(addons.filter((a) => a.id).map((a) => a.id));
  return {
    create: addons.filter((a) => !a.id).map(toAddonBody),
    update: addons.filter((a) => a.id).map((a) => ({ id: a.id, body: toAddonBody(a) })),
    remove: originalIds.filter((id) => !keptIds.has(id)),
  };
}

// ServiceMediaResponse[] → { cover, gallery, video }, each with the server id.
// The cover is the media flagged cover (else the first image).
export function mediasToForm(medias = []) {
  const images = medias.filter((m) => m.url && (!m.mediaType || m.mediaType === 'IMAGE'));
  const coverMedia = images.find((m) => m.cover) || images[0] || null;
  const videoMedia = medias.find((m) => m.url && m.mediaType === 'VIDEO') || null;
  const pick = (m) => (m ? { id: m.serviceMediaId, url: m.url } : null);
  return {
    cover: pick(coverMedia),
    gallery: images.filter((m) => m !== coverMedia).map(pick),
    video: pick(videoMedia),
  };
}

// Media calls that bring the server from `original` (mediasToForm shape) to the
// form values. Each op: { op: 'create', body } | { op: 'update', id, body } | { op: 'delete', id }.
export function planMediaChanges(original, { coverImage, gallery = [], videoUrl }) {
  const before = original || { cover: null, gallery: [], video: null };
  const ops = [];

  // Single slots (cover image, demo video): update in place, create, or delete.
  const syncSlot = (prev, url, mediaType, cover) => {
    const next = clean(url);
    if (prev && !next) ops.push({ op: 'delete', id: prev.id });
    else if (prev && next !== prev.url) ops.push({ op: 'update', id: prev.id, body: { url: next, mediaType, cover } });
    else if (!prev && next) ops.push({ op: 'create', body: { url: next, mediaType, cover } });
  };
  syncSlot(before.cover, coverImage, 'IMAGE', true);

  const keptIds = new Set(gallery.filter((g) => g.id).map((g) => g.id));
  before.gallery.filter((g) => !keptIds.has(g.id)).forEach((g) => ops.push({ op: 'delete', id: g.id }));
  gallery
    .filter((g) => !g.id && clean(g.url))
    .forEach((g) => ops.push({ op: 'create', body: { url: clean(g.url), mediaType: 'IMAGE', cover: false } }));

  syncSlot(before.video, videoUrl, 'VIDEO', false);
  return ops;
}

// Server media state (mediasToForm shape) after one planMediaChanges op has
// succeeded; `newId` is the serviceMediaId a create returned. Used to remember
// how far a failed save got, so the retry neither re-creates nor re-deletes.
export function applyMediaOp(state, step, newId = null) {
  const s = state || { cover: null, gallery: [], video: null };
  if (step.op === 'delete') {
    return {
      cover: s.cover?.id === step.id ? null : s.cover,
      gallery: s.gallery.filter((g) => g.id !== step.id),
      video: s.video?.id === step.id ? null : s.video,
    };
  }
  const id = step.op === 'update' ? step.id : newId;
  const item = { id, url: step.body.url };
  if (step.body.mediaType === 'VIDEO') return { ...s, video: item };
  if (step.body.cover) return { ...s, cover: item };
  return { ...s, gallery: [...s.gallery, item] };
}

// Gives form gallery rows the server id of an image with the same URL (the
// catalog keeps media URLs unique per service).
export const attachGalleryIds = (gallery = [], state = null) =>
  gallery.map((g) => {
    if (g.id || !state) return g;
    const saved = state.gallery.find((m) => m.url === clean(g.url));
    return saved ? { ...g, id: saved.id } : g;
  });
