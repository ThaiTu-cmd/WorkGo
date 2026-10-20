import { useCallback, useEffect, useState } from 'react';
import { availabilityApi, instantToTime, timeToInstant } from '../api/availabilityApi';
import { getAccessToken } from '../api/axiosClient';

// status: 'loading' | 'api' | 'needs-login' | 'forbidden' | 'error'
//  - api         : services from /services/my-services, rules/slots live
//  - forbidden   : my-services refused (account has no PROVIDER role)
//  - needs-login / error : nothing to show, the page explains why
const fromApiRule = (r) => ({
  id: r.availableRuleId,
  dayOfWeek: r.dayOfWeek,
  start: instantToTime(r.startTime),
  end: instantToTime(r.endTime),
  slotDurationMinute: r.slotDurationMinute,
  status: r.status,
});

const toApiBody = (rule) => ({
  dayOfWeek: rule.dayOfWeek,
  startTime: timeToInstant(rule.start),
  endTime: timeToInstant(rule.end),
  slotDurationMinute: rule.slotDurationMinute,
  status: rule.status,
});

export function useAvailability() {
  const [status, setStatus] = useState('loading');
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [rules, setRules] = useState([]);
  const [slots, setSlots] = useState([]);
  const [busy, setBusy] = useState(false);

  const isLive = status === 'api';

  // Load the service list (re-runs on sign-in / sign-out).
  useEffect(() => {
    let cancelled = false;
    const fail = (nextStatus) => {
      setStatus(nextStatus);
      setServices([]);
      setServiceId(null);
    };
    const load = async () => {
      if (!getAccessToken()) return fail('needs-login');
      setStatus('loading');
      try {
        const res = await availabilityApi.getMyServices();
        const list = (res?.result?.data ?? []).map((s) => ({ serviceId: s.serviceId, title: s.title }));
        if (cancelled) return;
        setServices(list);
        setServiceId(list[0]?.serviceId ?? null);
        setStatus('api');
      } catch (err) {
        if (cancelled) return;
        fail(err?.status === 401 ? 'needs-login' : err?.status === 403 ? 'forbidden' : 'error');
      }
    };
    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', load);
    };
  }, []);

  // Load rules + slots for the selected service.
  const reload = useCallback(async () => {
    if (!serviceId || !isLive) {
      setRules([]);
      setSlots([]);
      return;
    }
    setBusy(true);
    try {
      const [r, s] = await Promise.all([
        availabilityApi.getRules(serviceId),
        availabilityApi.getSlots(serviceId).catch(() => null),
      ]);
      setRules((r?.result?.data ?? []).map(fromApiRule));
      setSlots(s?.result?.data ?? []);
    } finally {
      setBusy(false);
    }
  }, [serviceId, isLive]);

  useEffect(() => {
    if (status === 'loading') return;
    reload().catch(() => setStatus('error'));
  }, [reload, status]);

  const saveRule = async (rule) => {
    if (!isLive) throw new Error('chưa kết nối được máy chủ');
    if (rule.id) await availabilityApi.updateRule(rule.id, toApiBody(rule));
    else await availabilityApi.createRule(serviceId, toApiBody(rule));
    await reload();
  };

  const deleteRule = async (ruleId) => {
    if (!isLive) throw new Error('chưa kết nối được máy chủ');
    await availabilityApi.deleteRule(ruleId);
    await reload();
  };

  return { status, isLive, busy, services, serviceId, setServiceId, rules, slots, saveRule, deleteRule };
}
