// Dates like nextHearingDate are stored as plain 'YYYY-MM-DD' strings.
// `new Date('2026-10-26')` parses that as UTC midnight, which shows the
// previous day for anyone west of UTC. Always go through these helpers.

export function parseLocalDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(value: string, days: number): string {
  const d = parseLocalDate(value) || new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from today to the date (negative = in the past). */
export function daysUntil(value?: string): number | null {
  const date = parseLocalDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export function formatDate(value?: string, style: 'short' | 'long' = 'short'): string {
  const d = parseLocalDate(value);
  if (!d) return 'Not scheduled';
  return style === 'long'
    ? d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Today", "Tomorrow", "In 5 days", "3 days ago". */
export function relativeDay(value?: string): string {
  const days = daysUntil(value);
  if (days === null) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
}

export const CLOSED_STATUSES = ['closed', 'won', 'lost'] as const;
export const isOpenStatus = (status: string) => !(CLOSED_STATUSES as readonly string[]).includes(status);
