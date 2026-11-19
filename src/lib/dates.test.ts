import { describe, expect, it } from "vitest";
import { clampMonth, daysRemainingInMonth, earliestMonth, isIsoDate, monthRange, shiftDays, shiftMonth, todayInTimeZone, weekRangeContaining } from "@/lib/dates";

describe("calendar dates", () => {
  it("accepts a leap day and rejects a fake one", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("2024-02-30")).toBe(false);
    expect(isIsoDate("2026-04-31")).toBe(false);
  });

  it("uses the real last day of the month", () => {
    expect(monthRange(2024, 2)).toEqual({ start: "2024-02-01", end: "2024-02-29" });
    expect(monthRange(2025, 2)).toEqual({ start: "2025-02-01", end: "2025-02-28" });
    expect(monthRange(2026, 12)).toEqual({ start: "2026-12-01", end: "2026-12-31" });
  });

  it("crosses year boundaries", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("shifts days across month ends", () => {
    expect(shiftDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("reads the calendar day in the user's time zone", () => {
    const instant = new Date("2026-01-15T23:30:00.000Z");
    expect(todayInTimeZone("Europe/Tirane", instant)).toBe("2026-01-16");
    expect(todayInTimeZone("UTC", instant)).toBe("2026-01-15");
  });

  it("includes today when counting remaining days", () => {
    expect(daysRemainingInMonth("2026-03-18", 2026, 3)).toBe(14);
    expect(daysRemainingInMonth("2026-03-31", 2026, 3)).toBe(1);
    expect(daysRemainingInMonth("2026-03-18", 2026, 2)).toBe(0);
    expect(weekRangeContaining("2026-03-18")).toEqual({ start: "2026-03-16", end: "2026-03-22" });
  });

  it("does not let the month filter move into a future month", () => {
    const current = { year: 2026, month: 10 };
    const start = earliestMonth(["2026-10-02"], "2026-10-02");
    expect(start).toEqual(current);
    expect(clampMonth({ year: 2026, month: 11 }, start, current)).toEqual(current);
    expect(clampMonth({ year: 2026, month: 1 }, start, current)).toEqual(start);
  });

  it("starts the filter at the first month with data", () => {
    expect(earliestMonth(["2026-08-20", "2026-10-01"], "2026-10-02")).toEqual({ year: 2026, month: 8 });
  });
});
