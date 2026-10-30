import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { pageItems } from '@/api/adapters';
import { evidenceApi } from '@/api/evidenceApi';
import { orderApi } from '@/api/orderApi';
import { qk } from '@/api/queryKeys';
import type { EvidenceDto, OrderDto, OrderRole, PageResponse } from '@/api/types';

import { historyItems } from './orderStatus';

const PAGE_SIZE = 10;

export function useOrders(role: OrderRole, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: qk.orders(role),
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await orderApi.getMyOrders(role, pageParam, PAGE_SIZE);
      const page = res?.result as PageResponse<OrderDto> | undefined;
      return { items: pageItems<OrderDto>(res), page: pageParam, totalPages: page?.totalPages ?? 1 };
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useOrderDetail(orderId: string, enabled: boolean) {
  const order = useQuery({
    queryKey: qk.order(orderId),
    enabled,
    queryFn: async () => (await orderApi.getOrder(orderId)).result,
  });
  const history = useQuery({
    queryKey: qk.orderHistory(orderId),
    enabled,
    queryFn: async () => historyItems(await orderApi.getHistory(orderId)),
  });
  const execution = useQuery({
    queryKey: qk.orderExecution(orderId),
    enabled,
    queryFn: async () => (await orderApi.getExecution(orderId)).result,
  });
  return { order, history, execution };
}

export function useEvidence(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.evidence(orderId),
    enabled,
    queryFn: async () => pageItems<EvidenceDto>(await evidenceApi.getEvidence(orderId)),
  });
}
