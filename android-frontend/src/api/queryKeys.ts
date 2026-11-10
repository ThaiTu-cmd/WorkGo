import type { OrderRole } from './types';

// React Query keys (spec §6). Service filtering happens on the device, so
// `services()` carries no filters.
export const qk = {
  categories: (parentId?: string) => ['categories', parentId ?? 'roots'] as const,
  services: () => ['services'] as const,
  service: (id: string) => ['service', id] as const,
  servicePackages: (id: string) => ['service-packages', id] as const,
  serviceAddons: (id: string) => ['service-addons', id] as const,
  serviceMedias: (id: string) => ['service-medias', id] as const,
  orders: (role: OrderRole) => ['orders', role] as const,
  order: (id: string) => ['order', id] as const,
  orderHistory: (id: string) => ['order-history', id] as const,
  orderExecution: (id: string) => ['order-execution', id] as const,
  evidence: (orderId: string) => ['evidence', orderId] as const,
  myServices: () => ['my-services'] as const,
  rules: (serviceId: string) => ['rules', serviceId] as const,
  slots: (serviceId: string) => ['slots', serviceId] as const,
  addresses: () => ['addresses'] as const,
  me: () => ['me'] as const,
  providerMe: () => ['provider-me'] as const,
};
