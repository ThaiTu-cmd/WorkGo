import type { Addon, Address, Package } from '@/api/adapters';
import type { ExecutionType, OrderCreationRequest } from '@/api/types';

// Shown to the client before ordering; the server computes the real price.
export function estimateTotal(pkg: Package | null, addons: Addon[], selectedAddonIds: string[]): number {
  const extras = addons.filter((a) => selectedAddonIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  return (pkg?.price ?? 0) + extras;
}

export type CheckoutInput = {
  service: { serviceId: string; executionType: ExecutionType };
  packageId: string | null;
  addonIds: string[];
  slotId: string | null;
  address: Address | null;
  availableSlotCount: number;
  addressCount: number;
};

export type CheckoutResult = { ok: true; body: OrderCreationRequest } | { ok: false; error: string };

// order-service requires bookingSlotId + address for ONSITE orders and
// rejects them otherwise; catch every missing piece before the request.
export function validateCheckout(input: CheckoutInput): CheckoutResult {
  if (!input.packageId) return { ok: false, error: 'Vui lòng chọn gói dịch vụ.' };
  const body: OrderCreationRequest = {
    serviceId: input.service.serviceId,
    packageId: input.packageId,
    addonIds: input.addonIds,
  };
  if (input.service.executionType !== 'ONSITE') return { ok: true, body };

  if (input.availableSlotCount === 0) return { ok: false, error: 'Dịch vụ chưa có lịch trống. Vui lòng quay lại sau.' };
  if (!input.slotId) return { ok: false, error: 'Vui lòng chọn thời gian.' };
  if (input.addressCount === 0) return { ok: false, error: 'Bạn chưa có địa chỉ. Hãy thêm địa chỉ trong Tài khoản.' };
  if (!input.address) return { ok: false, error: 'Vui lòng chọn địa chỉ.' };
  return { ok: true, body: { ...body, bookingSlotId: input.slotId, address: input.address.detail } };
}
