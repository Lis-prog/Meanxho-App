export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function shiftDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function isReasonableExpenseDate(value: string, today: string): boolean {
  if (!isIsoDate(value) || !isIsoDate(today)) return false;
  return value >= shiftDays(today, -3650) && value <= today;
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthText = String(month).padStart(2, "0");
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function parseMonthParam(value: string | undefined, fallbackIsoDate: string): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) return { year, month };
  }
  return {
    year: Number(fallbackIsoDate.slice(0, 4)),
    month: Number(fallbackIsoDate.slice(5, 7)),
  };
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isDateInMonth(isoDate: string, year: number, month: number): boolean {
  const [dateYear, dateMonth] = isoDate.split("-").map(Number);
  return dateYear === year && dateMonth === month;
}

export function todayInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return now.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(year: number, month: number, locale: string): string {
  const label = new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toLocaleUpperCase(locale === "sq" ? "sq-AL" : "en-GB") + label.slice(1);
}

export function formatDayLabel(isoDate: string, locale: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function clampDayOfMonth(year: number, month: number, day: number): number {
  return Math.min(Math.max(1, day), lastDayOfMonth(year, month));
}

export function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Remaining calendar days in the month, including today. Past months are 0. Future months are the full length. */
export function daysRemainingInMonth(today: string, year: number, month: number): number {
  const length = lastDayOfMonth(year, month);
  if (!isIsoDate(today)) return length;
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7));
  if (todayYear < year || (todayYear === year && todayMonth < month)) return length;
  if (todayYear > year || todayMonth > month) return 0;
  return length - Number(today.slice(8, 10)) + 1;
}

/** Monday–Sunday week that contains the given calendar date. */
export function weekRangeContaining(isoDate: string): { start: string; end: string } {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const toMonday = weekday === 0 ? -6 : 1 - weekday;
  const start = shiftDays(isoDate, toMonday);
  return { start, end: shiftDays(start, 6) };
}

export function utcWeekday(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addCalendarMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + months, 1));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = shifted.getUTCMonth() + 1;
  return isoFromParts(nextYear, nextMonth, clampDayOfMonth(nextYear, nextMonth, day));
}

export type YearMonth = { year: number; month: number };

export function monthFromIso(iso: string): YearMonth {
  return {
    year: Number(iso.slice(0, 4)),
    month: Number(iso.slice(5, 7)),
  };
}

export function compareMonths(left: YearMonth, right: YearMonth): number {
  return left.year * 12 + left.month - (right.year * 12 + right.month);
}

export function clampMonth(selected: YearMonth, min: YearMonth, max: YearMonth): YearMonth {
  if (compareMonths(selected, min) < 0) return min;
  if (compareMonths(selected, max) > 0) return max;
  return selected;
}

/** First month the user has anything to look at, never after the current month. */
export function earliestMonth(dates: string[], today: string): YearMonth {
  const current = monthFromIso(today);
  const valid = dates.filter(isIsoDate);
  if (valid.length === 0) return current;
  const first = valid.reduce((min, value) => (value < min ? value : min));
  const start = monthFromIso(first);
  return compareMonths(start, current) > 0 ? current : start;
}
