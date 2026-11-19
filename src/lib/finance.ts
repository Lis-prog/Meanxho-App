import { daysRemainingInMonth, isDateInMonth, addCalendarMonths } from "@/lib/dates";
import type { Cadence, ObligationCadence } from "@/lib/categories";
import { unpaidOccurrences, type ObligationRecord, type PaymentRecord } from "@/lib/plan";

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

export type BudgetLimit = {
  categoryId: string;
  monthlyLimitMinor: number;
};

export type BudgetAlert = {
  categoryId: string;
  spentMinor: number;
  limitMinor: number;
  ratio: number;
  level: "warn" | "hit" | "over";
};

export type ControlSummary = MonthSummary & {
  plannedUnpaidMinor: number;
  savingsTargetMinor: number;
  flexibleMinor: number;
  safeDailyMinor: number;
  daysRemaining: number;
  alerts: BudgetAlert[];
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

/**
 * Ledger leftover (income − spent), minus unpaid planned obligations and the
 * monthly savings target, divided by remaining days including today.
 *
 * Paid obligations are already inside spent, so they must not be subtracted again.
 */
export function summarizeControl(input: {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  obligations: ObligationRecord[];
  payments: PaymentRecord[];
  budgets?: BudgetLimit[];
  savingsTargetMinor: number;
  year: number;
  month: number;
  today: string;
}): ControlSummary {
  const month = summarizeMonth(input);
  const unpaid = unpaidOccurrences(input.obligations, input.payments, input.year, input.month);
  const plannedUnpaidMinor = unpaid.reduce((sum, row) => sum + row.amountMinor, 0);
  const savingsTargetMinor =
    Number.isInteger(input.savingsTargetMinor) && input.savingsTargetMinor > 0
      ? input.savingsTargetMinor
      : 0;
  const leftoverAfterPlan = month.remainingMinor - plannedUnpaidMinor;
  const flexibleMinor = leftoverAfterPlan - savingsTargetMinor;
  const daysRemaining = daysRemainingInMonth(input.today, input.year, input.month);
  const safeDailyMinor =
    daysRemaining > 0 && flexibleMinor > 0 ? Math.floor(flexibleMinor / daysRemaining) : 0;

  const spentByCategory = new Map(month.byCategory.map((row) => [row.categoryId, row.totalMinor]));
  const alerts: BudgetAlert[] = [];
  for (const budget of input.budgets ?? []) {
    if (!Number.isInteger(budget.monthlyLimitMinor) || budget.monthlyLimitMinor <= 0) continue;
    const spentMinor = spentByCategory.get(budget.categoryId) ?? 0;
    const ratio = spentMinor / budget.monthlyLimitMinor;
    if (ratio < 0.75) continue;
    alerts.push({
      categoryId: budget.categoryId,
      spentMinor,
      limitMinor: budget.monthlyLimitMinor,
      ratio,
      level: ratio >= 1.1 ? "over" : ratio >= 1 ? "hit" : "warn",
    });
  }
  alerts.sort((a, b) => b.ratio - a.ratio);

  return {
    ...month,
    plannedUnpaidMinor,
    savingsTargetMinor,
    flexibleMinor,
    safeDailyMinor,
    daysRemaining,
    alerts: alerts.slice(0, 4),
  };
}

export function savingsRate(incomeMinor: number, leftoverMinor: number): number | null {
  if (!Number.isInteger(incomeMinor) || incomeMinor <= 0) return null;
  return leftoverMinor / incomeMinor;
}

export function estimateGoalCompletion(input: {
  currentMinor: number;
  targetMinor: number;
  monthlyContributionMinor: number;
  today: string;
}): string | null {
  const remaining = input.targetMinor - input.currentMinor;
  if (remaining <= 0) return input.today;
  if (!Number.isInteger(input.monthlyContributionMinor) || input.monthlyContributionMinor <= 0) {
    return null;
  }
  const months = Math.ceil(remaining / input.monthlyContributionMinor);
  return addCalendarMonths(input.today, months);
}

export function applyGoalWithdrawal(currentMinor: number, amountMinor: number): number | null {
  if (!Number.isInteger(currentMinor) || currentMinor < 0) return null;
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) return null;
  if (amountMinor > currentMinor) return null;
  return currentMinor - amountMinor;
}

export function scenarioAnnualMinor(monthlyChangeMinor: number): number {
  if (!Number.isInteger(monthlyChangeMinor)) return 0;
  return monthlyChangeMinor * 12;
}

export function asObligationCadence(value: string): ObligationCadence | null {
  if (value === "monthly" || value === "weekly" || value === "yearly") return value;
  return null;
}
