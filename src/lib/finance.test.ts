import { describe, expect, it } from "vitest";
import {
  summarizeControl,
  summarizeMonth,
  estimateGoalCompletion,
  applyGoalWithdrawal,
  scenarioAnnualMinor,
} from "@/lib/finance";
import { unpaidPlannedMinor, occurrencesInMonth, resolvePaidAmount } from "@/lib/plan";

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

describe("obligations", () => {
  it("clamps the 31st to the last day of February, including leap years", () => {
    const rent = {
      id: "rent",
      amountMinor: 30_000,
      cadence: "monthly" as const,
      dueDay: 31,
      weekday: null,
      startOn: "2024-01-01",
      endOn: null,
      paused: false,
    };

    expect(occurrencesInMonth(rent, 2024, 2)[0]?.dueOn).toBe("2024-02-29");
    expect(occurrencesInMonth(rent, 2025, 2)[0]?.dueOn).toBe("2025-02-28");
    expect(occurrencesInMonth(rent, 2026, 3)[0]?.dueOn).toBe("2026-03-31");
  });

  it("does not count a monthly bill before its start date", () => {
    const netflix = {
      id: "netflix",
      amountMinor: 1_000,
      cadence: "monthly" as const,
      dueDay: 15,
      weekday: null,
      startOn: "2026-04-01",
      endOn: null,
      paused: false,
    };

    expect(occurrencesInMonth(netflix, 2026, 3)).toEqual([]);
    expect(occurrencesInMonth(netflix, 2026, 4)[0]?.periodKey).toBe("2026-04");
  });

  it("lists each weekly due date in the month", () => {
    const gym = {
      id: "gym",
      amountMinor: 500,
      cadence: "weekly" as const,
      dueDay: null,
      weekday: 1,
      startOn: "2026-03-01",
      endOn: null,
      paused: false,
    };

    const dates = occurrencesInMonth(gym, 2026, 3).map((row) => row.dueOn);
    expect(dates).toEqual(["2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23", "2026-03-30"]);
  });

  it("ignores paid occurrences when summing unpaid planned money", () => {
    const rent = {
      id: "rent",
      amountMinor: 30_000,
      cadence: "monthly" as const,
      dueDay: 1,
      weekday: null,
      startOn: "2026-01-01",
      endOn: null,
      paused: false,
    };

    expect(unpaidPlannedMinor([rent], [], 2026, 3)).toBe(30_000);
    expect(unpaidPlannedMinor([rent], [{ obligationId: "rent", periodKey: "2026-03" }], 2026, 3)).toBe(0);
  });

  it("uses the typed amount for a bill that changes each month", () => {
    expect(resolvePaidAmount("variable", 4_950, 6_200)).toBe(6_200);
    expect(resolvePaidAmount("variable", 4_950, null)).toBe(4_950);
    expect(resolvePaidAmount("fixed", 4_950, 6_200)).toBe(4_950);
  });
});

describe("summarizeControl", () => {
  const rent = {
    id: "rent",
    amountMinor: 30_000,
    cadence: "monthly" as const,
    dueDay: 1,
    weekday: null,
    startOn: "2026-01-01",
    endOn: null,
    paused: false,
  };

  it("subtracts unpaid bills and the savings target before daily safe-to-spend", () => {
    const summary = summarizeControl({
      year: 2026,
      month: 3,
      today: "2026-03-18",
      savingsTargetMinor: 20_000,
      incomes: [{ amountMinor: 120_000, cadence: "monthly", active: true, receivedOn: null }],
      expenses: [{ amountMinor: 10_000, spentOn: "2026-03-04", categoryId: "food" }],
      obligations: [rent],
      payments: [],
    });

    // leftover 110000 - unpaid rent 30000 - savings 20000 = 60000
    // 18 Mar → 14 days remaining including today
    expect(summary.remainingMinor).toBe(110_000);
    expect(summary.plannedUnpaidMinor).toBe(30_000);
    expect(summary.flexibleMinor).toBe(60_000);
    expect(summary.daysRemaining).toBe(14);
    expect(summary.safeDailyMinor).toBe(Math.floor(60_000 / 14));
  });

  it("does not subtract rent twice after it was marked paid", () => {
    const summary = summarizeControl({
      year: 2026,
      month: 3,
      today: "2026-03-18",
      savingsTargetMinor: 0,
      incomes: [{ amountMinor: 120_000, cadence: "monthly", active: true, receivedOn: null }],
      expenses: [{ amountMinor: 30_000, spentOn: "2026-03-01", categoryId: "rent" }],
      obligations: [rent],
      payments: [{ obligationId: "rent", periodKey: "2026-03" }],
    });

    expect(summary.spentMinor).toBe(30_000);
    expect(summary.plannedUnpaidMinor).toBe(0);
    expect(summary.flexibleMinor).toBe(90_000);
  });

  it("returns zero daily spend when the month is already over", () => {
    const summary = summarizeControl({
      year: 2026,
      month: 2,
      today: "2026-03-18",
      savingsTargetMinor: 0,
      incomes: [{ amountMinor: 100_000, cadence: "monthly", active: true, receivedOn: null }],
      expenses: [],
      obligations: [],
      payments: [],
    });

    expect(summary.daysRemaining).toBe(0);
    expect(summary.safeDailyMinor).toBe(0);
  });

  it("flags a category at 75%, 100%, and over 110%", () => {
    const summary = summarizeControl({
      year: 2026,
      month: 3,
      today: "2026-03-18",
      savingsTargetMinor: 0,
      incomes: [{ amountMinor: 100_000, cadence: "monthly", active: true, receivedOn: null }],
      expenses: [{ amountMinor: 8_000, spentOn: "2026-03-02", categoryId: "food" }],
      obligations: [],
      payments: [],
      budgets: [{ categoryId: "food", monthlyLimitMinor: 10_000 }],
    });

    expect(summary.alerts[0]?.level).toBe("warn");
    expect(summary.alerts[0]?.ratio).toBe(0.8);
  });
});

describe("goals and scenarios", () => {
  it("estimates completion from monthly contributions", () => {
    expect(
      estimateGoalCompletion({
        currentMinor: 50_000,
        targetMinor: 200_000,
        monthlyContributionMinor: 50_000,
        today: "2026-03-02",
      }),
    ).toBe("2026-06-02");
  });

  it("turns a monthly change into a yearly figure", () => {
    expect(scenarioAnnualMinor(4_000)).toBe(48_000);
  });

  it("subtracts a withdrawal from saved money", () => {
    expect(applyGoalWithdrawal(20_000, 5_000)).toBe(15_000);
  });

  it("rejects withdrawing more than is saved", () => {
    expect(applyGoalWithdrawal(20_000, 25_000)).toBeNull();
  });
});
