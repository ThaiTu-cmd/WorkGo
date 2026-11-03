// Pure helpers that turn the service form into catalog add-on / media calls
// (React-free so node:test can import them directly).

const clean = (s) => String(s ?? '').trim();

// AddOnResponse[] → editable form rows.
export const addonsToForm = (addons = []) =>
  addons
    .filter((a) => a.addOnId)
    .map((a) => ({ id: a.addOnId, name: a.name || '', desc: a.description || '', price: Number(a.price) || 0 }));

// Which add-ons to create, update or delete. Rows keep their server id; ids that
// were loaded but are no longer in the form were removed by the provider.
export function planAddonChanges(originalIds = [], addons = []) {
  const keptIds = new Set(addons.filter((a) => a.id).map((a) => a.id));
  const toBody = (a) => ({ name: clean(a.name), description: clean(a.desc), price: Number(a.price) || 0, currency: 'VND' });
  return {
    create: addons.filter((a) => !a.id).map(toBody),
    update: addons.filter((a) => a.id).map((a) => ({ id: a.id, body: toBody(a) })),
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
