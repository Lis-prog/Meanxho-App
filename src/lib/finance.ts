import { isDateInMonth } from "@/lib/dates";
import type { Cadence } from "@/lib/categories";

export type IncomeRecord = {
  amountMinor: number;
  cadence: Cadence;
  active: boolean;
  receivedOn: string | null;
};

export type ExpenseRecord = {
  amountMinor: number;
  spentOn: string;
  categoryId: string;
};

export type CategoryTotal = {
  categoryId: string;
  totalMinor: number;
};

export type MonthSummary = {
  incomeMinor: number;
  spentMinor: number;
  remainingMinor: number;
  todaySpentMinor: number;
  byCategory: CategoryTotal[];
};

/**
 * Monthly income is the planned amount for the whole calendar month.
 * One-time income counts only when its date falls inside that month.
 * Expenses are matched by their calendar date, not by the time they were saved.
 */
export function summarizeMonth(input: {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  year: number;
  month: number;
  today: string;
}): MonthSummary {
  let incomeMinor = 0;

  for (const income of input.incomes) {
    if (!income.active || !Number.isInteger(income.amountMinor) || income.amountMinor <= 0) continue;
    if (income.cadence === "monthly") {
      incomeMinor += income.amountMinor;
      continue;
    }
    if (income.receivedOn && isDateInMonth(income.receivedOn, input.year, input.month)) {
      incomeMinor += income.amountMinor;
    }
  }

  let spentMinor = 0;
  let todaySpentMinor = 0;
  const totals = new Map<string, number>();

  for (const expense of input.expenses) {
    if (!Number.isInteger(expense.amountMinor) || expense.amountMinor <= 0) continue;
    if (!isDateInMonth(expense.spentOn, input.year, input.month)) continue;
    spentMinor += expense.amountMinor;
    if (expense.spentOn === input.today) todaySpentMinor += expense.amountMinor;
    totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amountMinor);
  }

  const byCategory = [...totals.entries()]
    .map(([categoryId, totalMinor]) => ({ categoryId, totalMinor }))
    .sort((a, b) => b.totalMinor - a.totalMinor || a.categoryId.localeCompare(b.categoryId));

  return {
    incomeMinor,
    spentMinor,
    remainingMinor: incomeMinor - spentMinor,
    todaySpentMinor,
    byCategory,
  };
}
