import { http } from './client';
import type { ApiResponse, BookingSlotDto, Paged, RuleDto } from './types';
import { translate } from '@/i18n';

export type RuleBody = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinute: number;
  status: 'ACTIVE' | 'INACTIVE';
};

// catalog-service availability endpoints via gateway (/api/v1/catalog/**).
export const availabilityApi = {
  getRules: (serviceId: string, page = 0, size = 100) =>
    http.get<Paged<RuleDto>>(`/catalog/rules/services/${serviceId}`, { params: { page, size } }),

  createRule: (serviceId: string, body: RuleBody) => http.post<ApiResponse<RuleDto>>(`/catalog/rules/services/${serviceId}`, body),

  updateRule: (ruleId: string, body: RuleBody) => http.put<ApiResponse<RuleDto>>(`/catalog/rules/${ruleId}`, body),

  deleteRule: (ruleId: string) => http.delete<ApiResponse<unknown>>(`/catalog/rules/${ruleId}`),

  // Soonest first. The backend defaults the window to [now, now + 28 days].
  getSlots: (serviceId: string, { from, to, page = 0, size = 50 }: { from?: string; to?: string; page?: number; size?: number } = {}) =>
    http.get<Paged<BookingSlotDto>>(`/catalog/slots/services/${serviceId}`, {
      params: { page, size, ...(from && { from }), ...(to && { to }) },
    }),
};

// Rules store a time-of-day as an Instant on 1970-01-01, written in the
// provider's local zone (seed "08:00" comes back as 01:00Z in UTC+7).
export const instantToTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const timeToInstant = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(1970, 0, 1, h, m, 0).toISOString();
};

export const timeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// catalog AvailableRule.dayOfWeek: 2 = Monday … 8 = Sunday.
export const WEEK_DAYS = [
  { value: 2, get label() {
    return translate('availabilityApi.thu_2');
  }, short: 'T2' },
  { value: 3, get label() {
    return translate('availabilityApi.thu_3');
  }, short: 'T3' },
  { value: 4, get label() {
    return translate('availabilityApi.thu_4');
  }, short: 'T4' },
  { value: 5, get label() {
    return translate('availabilityApi.thu_5');
  }, short: 'T5' },
  { value: 6, get label() {
    return translate('availabilityApi.thu_6');
  }, short: 'T6' },
  { value: 7, get label() {
    return translate('availabilityApi.thu_7');
  }, short: 'T7' },
  { value: 8, get label() {
    return translate('availabilityApi.chu_nhat');
  }, short: 'CN' },
] as const;
