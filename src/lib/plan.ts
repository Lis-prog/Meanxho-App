import {
  clampDayOfMonth,
  isDateInMonth,
  isoFromParts,
  lastDayOfMonth,
  monthKey,
  monthRange,
  shiftDays,
  utcWeekday,
} from "@/lib/dates";
import type { ObligationCadence } from "@/lib/categories";

export type ObligationRecord = {
  id: string;
  amountMinor: number;
  cadence: ObligationCadence;
  dueDay: number | null;
  weekday: number | null;
  startOn: string;
  endOn: string | null;
  paused: boolean;
};

export type PaymentRecord = {
  obligationId: string;
  periodKey: string;
};

export type ObligationOccurrence = {
  obligationId: string;
  periodKey: string;
  dueOn: string;
  amountMinor: number;
};

function stillActiveOn(record: ObligationRecord, date: string): boolean {
  if (record.paused) return false;
  if (date < record.startOn) return false;
  if (record.endOn && date > record.endOn) return false;
  return true;
}

export function occurrencesInMonth(
  record: ObligationRecord,
  year: number,
  month: number,
): ObligationOccurrence[] {
  if (record.paused || !Number.isInteger(record.amountMinor) || record.amountMinor <= 0) {
    return [];
  }

  const range = monthRange(year, month);
  if (record.startOn > range.end) return [];
  if (record.endOn && record.endOn < range.start) return [];

  if (record.cadence === "monthly") {
    const dueOn = isoFromParts(year, month, clampDayOfMonth(year, month, record.dueDay ?? 1));
    if (!stillActiveOn(record, dueOn)) return [];
    return [{ obligationId: record.id, periodKey: monthKey(year, month), dueOn, amountMinor: record.amountMinor }];
  }

  if (record.cadence === "yearly") {
    const anniversaryMonth = Number(record.startOn.slice(5, 7));
    if (anniversaryMonth !== month) return [];
    const dueDay = record.dueDay ?? Number(record.startOn.slice(8, 10));
    const dueOn = isoFromParts(year, month, clampDayOfMonth(year, month, dueDay));
    if (!stillActiveOn(record, dueOn)) return [];
    return [{ obligationId: record.id, periodKey: String(year), dueOn, amountMinor: record.amountMinor }];
  }

  const weekday = record.weekday ?? 1;
  const found: ObligationOccurrence[] = [];
  let cursor = record.startOn > range.start ? record.startOn : range.start;
  while (cursor <= range.end) {
    if (stillActiveOn(record, cursor) && utcWeekday(cursor) === weekday) {
      found.push({
        obligationId: record.id,
        periodKey: cursor,
        dueOn: cursor,
        amountMinor: record.amountMinor,
      });
    }
    cursor = shiftDays(cursor, 1);
  }
  return found;
}

export function unpaidOccurrences(
  obligations: ObligationRecord[],
  payments: PaymentRecord[],
  year: number,
  month: number,
): ObligationOccurrence[] {
  const paid = new Set(payments.map((row) => `${row.obligationId}:${row.periodKey}`));
  const unpaid: ObligationOccurrence[] = [];
  for (const obligation of obligations) {
    for (const occurrence of occurrencesInMonth(obligation, year, month)) {
      if (!paid.has(`${occurrence.obligationId}:${occurrence.periodKey}`)) {
        unpaid.push(occurrence);
      }
    }
  }
  return unpaid;
}

export function resolvePaidAmount(
  amountMode: string,
  plannedMinor: number,
  enteredMinor: number | null,
): number | null {
  if (!Number.isInteger(plannedMinor) || plannedMinor <= 0) return null;
  if (amountMode === "variable") {
    if (enteredMinor === null) return plannedMinor;
    if (!Number.isInteger(enteredMinor) || enteredMinor <= 0) return null;
    return enteredMinor;
  }
  return plannedMinor;
}

export function unpaidPlannedMinor(
  obligations: ObligationRecord[],
  payments: PaymentRecord[],
  year: number,
  month: number,
): number {
  return unpaidOccurrences(obligations, payments, year, month).reduce(
    (sum, row) => sum + row.amountMinor,
    0,
  );
}

export function isOccurrenceInMonth(dueOn: string, year: number, month: number): boolean {
  return isDateInMonth(dueOn, year, month);
}

export function dueDayValid(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

export function weekdayValid(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

export function lastDueDateThisMonth(year: number, month: number, dueDay: number): string {
  return isoFromParts(year, month, clampDayOfMonth(year, month, dueDay));
}

export function remainingDaysLabel(days: number): number {
  return Math.max(0, days);
}

export { lastDayOfMonth };
