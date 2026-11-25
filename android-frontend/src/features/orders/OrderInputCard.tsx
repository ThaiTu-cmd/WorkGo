import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text } from 'react-native';
import { ApiError, orderErrorMessage } from '@/api/errors';
import { orderApi } from '@/api/orderApi';
import { qk } from '@/api/queryKeys';
import type { OrderDto, OrderRole } from '@/api/types';
import { useT } from '@/i18n';
import { Button, Card, TextField } from '@/ui';

export function OrderInputCard({ order, role }: { order: OrderDto; role: OrderRole }) {
  const t = useT();
  const queries = useQueryClient();
  const [requirements, setRequirements] = useState('');
  const [none, setNone] = useState(false);
  const [values, setValues] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const inputs = useQuery({ queryKey: [...qk.order(order.orderId), 'inputs'], queryFn: async () => {
    try { return (await orderApi.getInputs(order.orderId)).result; }
    catch (e) { if (e instanceof ApiError && e.code === 3051) return null; throw e; }
  }});
  const agreement = useQuery({ queryKey: [...qk.order(order.orderId), 'agreement'], queryFn: async () => (await orderApi.getAgreement(order.orderId)).result });
  const row = inputs.data;
  const current = agreement.data?.at(-1);
  const editable = ['PENDING_PAYMENT', 'CONFIRMED'].includes(order.orderStatus);
  const version = { checklistVersion: row?.checklistVersion ?? 0, expectedVersion: row?.version ?? -1 };
  const mutation = useMutation({ mutationFn: (send: () => Promise<unknown>) => send(),
    onSuccess: () => { setError(''); },
    onError: e => setError(orderErrorMessage(e)),
    onSettled: async () => {
      await Promise.all([qk.order(order.orderId), qk.orderExecution(order.orderId), qk.orderHistory(order.orderId), qk.orders(role)]
        .map(queryKey => queries.invalidateQueries({ queryKey })));
    },
  });
  const run = (send: () => Promise<unknown>) => { if (!mutation.isPending) mutation.mutate(send); };
  return <Card>
    <Text accessibilityRole="header">{t('orderInputs.title')}</Text>
    {(error || inputs.error || agreement.error) ? <Text accessibilityLiveRegion="polite">{error || orderErrorMessage(inputs.error ?? agreement.error)}</Text> : null}
    <Button title={t('orderInputs.retry')} variant="secondary" disabled={mutation.isPending} onPress={() => { void inputs.refetch(); void agreement.refetch(); }} />
    {row ? <>
      <Text selectable>{row.requirements === '[]' ? t('orderInputs.none') : JSON.parse(row.requirements).join('\n')}</Text>
      {row.submittedValues ? <><Text>{t('orderInputs.stored')}</Text><Text selectable>{JSON.stringify(JSON.parse(row.submittedValues), null, 2)}</Text></> : null}
      {row.missingReason ? <Text>{row.missingReason}</Text> : null}
      {row.acceptedAt ? <Text>{t('orderInputs.accepted')}</Text> : row.responseDueAt ? <Text>{t('orderInputs.waiting')} {new Date(row.responseDueAt).toLocaleString()}</Text> : null}
    </> : <Text>{t('orderInputs.pending')}</Text>}
    {editable && current && inputs.isSuccess && !row?.clientConfirmedAt && role === 'PROVIDER' ? <>
      <TextField label={t('orderInputs.proposal')} value={requirements} onChangeText={setRequirements} multiline editable={!mutation.isPending && !none} />
      <Button title={`${none ? '✓ ' : ''}${t('orderInputs.none')}`} variant="secondary" onPress={() => setNone(v => !v)} disabled={mutation.isPending} />
      <Button title={t('orderInputs.propose')} loading={mutation.isPending} disabled={!none && !requirements.trim()}
        onPress={() => run(() => orderApi.proposeInputs(order.orderId, { agreementVersion: current.versionNo, requirements: none ? [] : requirements.split('\n').map(x => x.trim()).filter(Boolean) }))} />
    </> : null}
    {editable && row && !row.clientConfirmedAt && role === 'CLIENT' ? <Button title={t('orderInputs.confirm')} loading={mutation.isPending} onPress={() => run(() => orderApi.confirmInputs(order.orderId, version))} /> : null}
    {editable && row?.clientConfirmedAt && !row.acceptedAt && !row.responseDueAt && role === 'CLIENT' ? <>
      <TextField label={t('orderInputs.values')} value={values} onChangeText={setValues} multiline editable={!mutation.isPending} />
      <Button title={t('orderInputs.submit')} loading={mutation.isPending} disabled={!values.trim()} onPress={() => run(() => orderApi.submitInputs(order.orderId, { ...version, values: { description: values.trim() } }))} />
    </> : null}
    {editable && row?.responseDueAt && !row.acceptedAt && role === 'PROVIDER' ? <>
      <Button title={t('orderInputs.accept')} loading={mutation.isPending} onPress={() => run(() => orderApi.reviewInputs(order.orderId, { ...version, sufficient: true }))} />
      <TextField label={t('orderInputs.missing')} value={reason} onChangeText={setReason} multiline editable={!mutation.isPending} />
      <Button title={t('orderInputs.reject')} disabled={!reason.trim()} loading={mutation.isPending} onPress={() => run(() => orderApi.reviewInputs(order.orderId, { ...version, sufficient: false, missingReason: reason.trim() }))} />
    </> : null}
  </Card>;
}
