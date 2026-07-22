import { DateTime } from "luxon";

export type Interval = { start: number; end: number }; // minutes from local midnight

export type AvailabilityRule = { weekday: number; startMinute: number; endMinute: number };
export type BusyAppointment = { startsAt: Date; endsAt: Date };

/**
 * Pure slot computation for a single day. All values are minutes-from-local-midnight.
 * Returns the START minute of every window where a `durationMin` appointment fits inside
 * a working window and overlaps no busy interval. No timezone logic here — fully testable.
 */
export function computeOpenSlots(params: {
  windows: Interval[];
  busy: Interval[];
  durationMin: number;
  stepMin: number;
}): number[] {
  const { windows, busy, durationMin, stepMin } = params;
  if (durationMin <= 0 || stepMin <= 0) return [];

  const slots: number[] = [];
  for (const w of windows) {
    for (let start = w.start; start + durationMin <= w.end; start += stepMin) {
      const end = start + durationMin;
      const overlaps = busy.some((b) => start < b.end && end > b.start);
      if (!overlaps) slots.push(start);
    }
  }
  return slots;
}

/**
 * Open appointment start times (as UTC Dates) for a calendar date in the business timezone.
 * The timezone conversion is the only impure part; the slot math is delegated to computeOpenSlots.
 */
export function openSlotsForDate(params: {
  date: string; // "YYYY-MM-DD" interpreted in `timezone`
  timezone: string;
  rules: AvailabilityRule[];
  durationMin: number;
  stepMin?: number;
  appointments: BusyAppointment[];
}): Date[] {
  const { date, timezone, rules, durationMin, stepMin = 15, appointments } = params;

  const dayStart = DateTime.fromISO(date, { zone: timezone }).startOf("day");
  if (!dayStart.isValid) return [];
  const nextDay = dayStart.plus({ days: 1 });

  // luxon weekday: 1=Mon … 7=Sun. Our rules use 0=Sun … 6=Sat.
  const weekday = dayStart.weekday % 7;
  const windows = rules
    .filter((r) => r.weekday === weekday)
    .map((r) => ({ start: r.startMinute, end: r.endMinute }));
  if (windows.length === 0) return [];

  const busy: Interval[] = appointments
    .map((a) => ({
      s: DateTime.fromJSDate(a.startsAt).setZone(timezone),
      e: DateTime.fromJSDate(a.endsAt).setZone(timezone),
    }))
    .filter(({ s, e }) => e > dayStart && s < nextDay)
    .map(({ s, e }) => ({
      start: Math.max(0, Math.floor(s.diff(dayStart, "minutes").minutes)),
      end: Math.min(1440, Math.ceil(e.diff(dayStart, "minutes").minutes)),
    }));

  return computeOpenSlots({ windows, busy, durationMin, stepMin }).map((m) =>
    dayStart.plus({ minutes: m }).toUTC().toJSDate(),
  );
}
