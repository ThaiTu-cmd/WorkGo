// order-service order numbers are long:
//   "WG" + Instant.now() + "-" + UUID   e.g. WG2026-11-11T07:39:15.553032500Z-f5da0b14-b371-...
//   "WG-P-" + UUID                      (orders created from a job proposal)
// For display keep the prefix and the first block of the UUID: WG-F5DA0B14, WG-P-F5DA0B14.
// Searching and the tooltip still use the full number.
const UUID_RE = /([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function shortOrderNumber(orderNumber, orderId) {
  const full = String(orderNumber || '').trim();
  if (!full) return orderId ? `WG-${String(orderId).slice(0, 8).toUpperCase()}` : '';
  if (full.length <= 16) return full;
  const uuid = UUID_RE.exec(full);
  if (uuid) return `${full.startsWith('WG-P-') ? 'WG-P' : 'WG'}-${uuid[1].toUpperCase()}`;
  return `${full.slice(0, 6)}…${full.slice(-6)}`;
}

// Short form of an order object ({ orderNumber, orderId }).
export const orderLabel = (order) => shortOrderNumber(order?.orderNumber, order?.orderId);

export default shortOrderNumber;
