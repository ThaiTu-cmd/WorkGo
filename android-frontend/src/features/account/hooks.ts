import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addressApi } from '@/api/addressApi';
import { fromAddressForm, pageItems, toAddress, type AddressForm } from '@/api/adapters';
import { authApi, type UserDto } from '@/api/authApi';
import { qk } from '@/api/queryKeys';
import type { AddressDto } from '@/api/types';

export function useMe(enabled: boolean) {
  return useQuery({ queryKey: qk.me(), enabled, queryFn: async () => (await authApi.getMyInfo()).result });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<UserDto>) => authApi.updateMyInfo(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.me() }),
  });
}

export function useAddresses(enabled: boolean) {
  return useQuery({
    queryKey: qk.addresses(),
    enabled,
    queryFn: async () => pageItems<AddressDto>(await addressApi.getMy()).map(toAddress),
  });
}

export function useSaveAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    // PUT overwrites every column, so the full form is always sent.
    mutationFn: ({ id, form }: { id: string | null; form: AddressForm }) =>
      id ? addressApi.update(id, fromAddressForm(form)) : addressApi.create(fromAddressForm(form)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.addresses() }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.addresses() }),
  });
}
