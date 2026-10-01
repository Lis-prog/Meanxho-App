import { describe, expect, it } from "vitest";
import { isIsoDate, monthRange, shiftDays, shiftMonth, todayInTimeZone } from "@/lib/dates";

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
});
