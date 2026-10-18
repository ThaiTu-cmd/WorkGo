import { useCallback, useEffect, useRef, useState } from 'react';
import { availabilityApi, instantToTime, timeToInstant } from '../api/availabilityApi';
import { getAccessToken } from '../api/axiosClient';
import {
  SEED_SERVICE_IDS,
  mockAvailabilityServices,
  mockRules,
  mockSlots,
} from '../data/mockAvailability';

// status: 'loading' | 'api' | 'seed-services' | 'needs-login' | 'error'
//  - api            : services from /services/my-services, rules/slots live
//  - seed-services  : my-services refused (no PROVIDER permission) → seeded DB
//                     services, rules/slots still live
//  - needs-login / error : bundled mocks, edits stay in local state
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
  const mockRulesRef = useRef(structuredClone(mockRules));

  const isLive = status === 'api' || status === 'seed-services';

  const applyMocks = useCallback((nextStatus) => {
    setStatus(nextStatus);
    setServices(mockAvailabilityServices);
    setServiceId((id) =>
      mockAvailabilityServices.some((s) => s.serviceId === id) ? id : mockAvailabilityServices[0].serviceId
    );
  }, []);

  // Load the service list (re-runs on sign-in / sign-out).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!getAccessToken()) return applyMocks('needs-login');
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
        if (err?.status === 401) return applyMocks('needs-login');
        if (err?.status !== 403) return applyMocks('error');
        // No PROVIDER permission: fall back to seeded services that exist in the DB.
        const found = await Promise.all(
          SEED_SERVICE_IDS.map((id) => availabilityApi.getService(id).catch(() => null))
        );
        if (cancelled) return;
        const list = found
          .map((r) => r?.result)
          .filter(Boolean)
          .map((s) => ({ serviceId: s.serviceId, title: s.title }));
        if (!list.length) return applyMocks('error');
        setServices(list);
        setServiceId(list[0].serviceId);
        setStatus('seed-services');
      }
    };
    load();
    window.addEventListener('workgo-auth-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('workgo-auth-changed', load);
    };
  }, [applyMocks]);

  // Load rules + slots for the selected service.
  const reload = useCallback(async () => {
    if (!serviceId) {
      setRules([]);
      setSlots([]);
      return;
    }
    if (!isLive) {
      setRules(mockRulesRef.current[serviceId] ?? []);
      setSlots(mockSlots[serviceId] ?? []);
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
    if (!isLive) {
      const list = mockRulesRef.current[serviceId] ?? [];
      mockRulesRef.current[serviceId] = rule.id
        ? list.map((r) => (r.id === rule.id ? rule : r))
        : [...list, { ...rule, id: `m-${Date.now()}` }];
      setRules(mockRulesRef.current[serviceId]);
      return;
    }
    if (rule.id) await availabilityApi.updateRule(rule.id, toApiBody(rule));
    else await availabilityApi.createRule(serviceId, toApiBody(rule));
    await reload();
  };

  const deleteRule = async (ruleId) => {
    if (!isLive) {
      mockRulesRef.current[serviceId] = (mockRulesRef.current[serviceId] ?? []).filter((r) => r.id !== ruleId);
      setRules(mockRulesRef.current[serviceId]);
      return;
    }
    await availabilityApi.deleteRule(ruleId);
    await reload();
  };

  return { status, isLive, busy, services, serviceId, setServiceId, rules, slots, saveRule, deleteRule };
}
