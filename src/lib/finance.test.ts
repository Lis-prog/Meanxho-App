import { describe, expect, it } from "vitest";
import { summarizeMonth } from "@/lib/finance";

describe("summarizeMonth", () => {
  const base = {
    year: 2026,
    month: 3,
    today: "2026-03-18",
  };

  it("counts active monthly income and ignores paused income", () => {
    const summary = summarizeMonth({
      ...base,
      incomes: [
        { amountMinor: 120_000, cadence: "monthly", active: true, receivedOn: null },
        { amountMinor: 50_000, cadence: "monthly", active: false, receivedOn: null },
      ],
      expenses: [],
    });

    expect(summary.incomeMinor).toBe(120_000);
    expect(summary.remainingMinor).toBe(120_000);
    expect(summary.spentMinor).toBe(0);
  });

  it("counts one-time income only inside its month", () => {
    const summary = summarizeMonth({
      ...base,
      incomes: [
        { amountMinor: 30_000, cadence: "once", active: true, receivedOn: "2026-03-02" },
        { amountMinor: 80_000, cadence: "once", active: true, receivedOn: "2026-04-02" },
      ],
      expenses: [],
    });

    expect(summary.incomeMinor).toBe(30_000);
  });

  it("keeps spending inside the month and isolates today", () => {
    const summary = summarizeMonth({
      ...base,
      incomes: [{ amountMinor: 100_000, cadence: "monthly", active: true, receivedOn: null }],
      expenses: [
        { amountMinor: 650, spentOn: "2026-03-18", categoryId: "food" },
        { amountMinor: 2_000, spentOn: "2026-03-01", categoryId: "food" },
        { amountMinor: 900, spentOn: "2026-03-18", categoryId: "transport" },
        { amountMinor: 5_000, spentOn: "2026-02-28", categoryId: "food" },
      ],
    });

    expect(summary.spentMinor).toBe(3_550);
    expect(summary.todaySpentMinor).toBe(1_550);
    expect(summary.remainingMinor).toBe(96_450);
    expect(summary.byCategory).toEqual([
      { categoryId: "food", totalMinor: 2_650 },
      { categoryId: "transport", totalMinor: 900 },
    ]);
  });

  it("lets remaining go negative when spending passes income", () => {
    const summary = summarizeMonth({
      ...base,
      incomes: [{ amountMinor: 1_000, cadence: "monthly", active: true, receivedOn: null }],
      expenses: [{ amountMinor: 2_500, spentOn: "2026-03-04", categoryId: "rent" }],
    });

    expect(summary.remainingMinor).toBe(-1_500);
  });
});
