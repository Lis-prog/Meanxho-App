"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isIsoDate, todayInTimeZone } from "@/lib/dates";
import { applyGoalWithdrawal } from "@/lib/finance";
import { parseAmountToMinor, parseOptionalMinor } from "@/lib/money";
import { getCurrentUser } from "@/lib/current-user";
import { occurrencesInMonth, resolvePaidAmount } from "@/lib/plan";
import {
  billAmountSchema,
  budgetSchema,
  contributionSchema,
  goalSchema,
  loanSchema,
  obligationSchema,
  onboardingSchema,
  savingsTargetSchema,
  type ActionState,
} from "@/lib/validators";
import type { AmountMode, ObligationCadence, ObligationKind } from "@/lib/categories";
import { categoryKeyForKind } from "@/lib/categories";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/end");
  return user;
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/plan");
  revalidatePath("/savings");
  revalidatePath("/budgets");
  revalidatePath("/reports");
  revalidatePath("/transactions");
  revalidatePath("/income");
  revalidatePath("/add");
  revalidatePath("/onboarding");
}

async function categoryIdFor(userId: string, key: string) {
  const category = await prisma.category.findFirst({ where: { userId, key } });
  if (category) return category.id;
  const fallback = await prisma.category.findFirst({ where: { userId, archived: false }, orderBy: { sortOrder: "asc" } });
  if (!fallback) throw new Error("no-category");
  return fallback.id;
}

function asCadence(value: string): ObligationCadence | null {
  if (value === "monthly" || value === "weekly" || value === "yearly") return value;
  return null;
}

function asAmountMode(value: string): AmountMode | null {
  if (value === "fixed" || value === "variable") return value;
  return null;
}

function parseDay(raw: string): number | null {
  if (!raw.trim()) return null;
  const day = Number(raw);
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  return day;
}

function parseWeekday(raw: string): number | null {
  if (!raw.trim()) return null;
  const day = Number(raw);
  if (!Number.isInteger(day) || day < 0 || day > 6) return null;
  return day;
}

function parseInterestBps(raw: string): number | null {
  if (!raw.trim()) return 0;
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100);
}

export async function completeOnboardingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.onboardingCompletedAt) redirect("/dashboard");

  const parsed = onboardingSchema.safeParse({
    income: formData.get("income") ?? "",
    rent: formData.get("rent") ?? "",
    loanPayment: formData.get("loanPayment") ?? "",
    loanRemaining: formData.get("loanRemaining") ?? "",
    subscription: formData.get("subscription") ?? "",
    savings: formData.get("savings") ?? "",
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const income = parseOptionalMinor(parsed.data.income, user.currency);
  const rent = parseOptionalMinor(parsed.data.rent, user.currency);
  const loanPayment = parseOptionalMinor(parsed.data.loanPayment, user.currency);
  const loanRemaining = parseOptionalMinor(parsed.data.loanRemaining, user.currency);
  const subscription = parseOptionalMinor(parsed.data.subscription, user.currency);
  const savings = parseOptionalMinor(parsed.data.savings, user.currency);
  if ([income, rent, loanPayment, loanRemaining, subscription, savings].some((value) => value === null)) {
    return { error: "errorAmount" };
  }

  const today = todayInTimeZone(user.timezone);
  const labels =
    user.locale === "en"
      ? { rent: "Rent", loan: "Loan", sub: "Subscriptions" }
      : { rent: "Qira", loan: "Kredi", sub: "Abonime" };

  await prisma.$transaction(async (tx) => {
    if (income && income > 0) {
      await tx.income.create({
        data: {
          userId: user.id,
          amountMinor: income,
          kind: "salary",
          cadence: "monthly",
          active: true,
        },
      });
    }

    if (rent && rent > 0) {
      await tx.obligation.create({
        data: {
          userId: user.id,
          categoryId: await categoryIdFor(user.id, "rent"),
          name: labels.rent,
          amountMinor: rent,
          cadence: "monthly",
          dueDay: 1,
          startOn: today.slice(0, 8) + "01",
          kind: "rent",
        },
      });
    }

    if (loanPayment && loanPayment > 0) {
      const remaining = loanRemaining && loanRemaining > 0 ? loanRemaining : loanPayment;
      const obligation = await tx.obligation.create({
        data: {
          userId: user.id,
          categoryId: await categoryIdFor(user.id, "loan"),
          name: labels.loan,
          amountMinor: loanPayment,
          cadence: "monthly",
          dueDay: 10,
          startOn: today.slice(0, 8) + "01",
          kind: "loan",
        },
      });
      await tx.loan.create({
        data: {
          userId: user.id,
          obligationId: obligation.id,
          originalMinor: remaining,
          remainingMinor: remaining,
        },
      });
    }

    if (subscription && subscription > 0) {
      await tx.obligation.create({
        data: {
          userId: user.id,
          categoryId: await categoryIdFor(user.id, "subscriptions"),
          name: labels.sub,
          amountMinor: subscription,
          cadence: "monthly",
          dueDay: 15,
          startOn: today.slice(0, 8) + "01",
          kind: "subscription",
        },
      });
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        savingsTargetMinor: savings ?? 0,
        onboardingCompletedAt: new Date(),
      },
    });
  });

  refresh();
  redirect("/dashboard");
}

export async function skipOnboardingAction() {
  const user = await requireUser();
  if (!user.onboardingCompletedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompletedAt: new Date() },
    });
  }
  redirect("/dashboard");
}

export async function createObligationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = obligationSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    cadence: formData.get("cadence"),
    kind: formData.get("kind"),
    amountMode: formData.get("amountMode") ?? "fixed",
    dueDay: formData.get("dueDay") ?? "",
    weekday: formData.get("weekday") ?? "",
    startOn: formData.get("startOn"),
    endOn: formData.get("endOn") ?? "",
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };
  const cadence = asCadence(parsed.data.cadence);
  if (!cadence) return { error: "errorInvalid" };
  if (!isIsoDate(parsed.data.startOn)) return { error: "errorDate" };
  const endOn = parsed.data.endOn ? parsed.data.endOn : null;
  if (endOn && !isIsoDate(endOn)) return { error: "errorDate" };
  if (endOn && endOn < parsed.data.startOn) return { error: "errorDate" };

  const dueDay = cadence === "weekly" ? null : parseDay(parsed.data.dueDay) ?? 1;
  const weekday = cadence === "weekly" ? parseWeekday(parsed.data.weekday) : null;
  if (cadence === "weekly" && weekday === null) return { error: "errorInvalid" };

  const kind = parsed.data.kind as ObligationKind;

  const mappedKey = categoryKeyForKind(kind);
  let categoryId: string;
  if (mappedKey) {
    categoryId = await categoryIdFor(user.id, mappedKey);
  } else {
    const chosen = String(formData.get("categoryId") ?? "");
    const category = await prisma.category.findFirst({
      where: { id: chosen, userId: user.id, archived: false },
    });
    if (!category) return { error: "errorCategory" };
    categoryId = category.id;
  }

  const amountMode =
    kind === "utility"
      ? "variable"
      : kind === "other"
        ? (asAmountMode(parsed.data.amountMode) ?? "fixed")
        : "fixed";

  await prisma.obligation.create({
    data: {
      userId: user.id,
      categoryId,
      name: parsed.data.name,
      amountMinor,
      cadence,
      kind,
      amountMode,
      dueDay,
      weekday,
      startOn: parsed.data.startOn,
      endOn,
    },
  });

  refresh();
  redirect("/plan");
}

export async function toggleObligationAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const obligation = await prisma.obligation.findFirst({ where: { id, userId: user.id } });
  if (!obligation) redirect("/plan");
  await prisma.obligation.update({ where: { id: obligation.id }, data: { paused: !obligation.paused } });
  refresh();
  redirect("/plan");
}

export async function deleteObligationAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.obligation.deleteMany({ where: { id, userId: user.id } });
  refresh();
  redirect("/plan");
}

export async function updateObligationPlanAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = billAmountSchema.safeParse({
    amount: formData.get("amount"),
    amountMode: formData.get("amountMode") ?? "fixed",
  });
  if (!parsed.success) return { error: "errorInvalid" };
  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };
  const amountMode = asAmountMode(parsed.data.amountMode);
  if (!amountMode) return { error: "errorInvalid" };

  const obligation = await prisma.obligation.findFirst({ where: { id, userId: user.id } });
  if (!obligation) return { error: "errorNotFound" };

  await prisma.obligation.update({
    where: { id: obligation.id },
    data: { amountMinor, amountMode },
  });
  refresh();
  redirect("/plan");
}

export async function markObligationPaidAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const periodKey = String(formData.get("periodKey") ?? "");
  const obligation = await prisma.obligation.findFirst({
    where: { id, userId: user.id },
    include: { loan: true },
  });
  if (!obligation || !periodKey) redirect("/plan");

  const rawAmount = String(formData.get("amount") ?? "").trim();
  const enteredMinor = rawAmount ? parseAmountToMinor(rawAmount, user.currency) : null;
  if (rawAmount && enteredMinor === null) return { error: "errorAmount" };

  const paidMinor = resolvePaidAmount(obligation.amountMode, obligation.amountMinor, enteredMinor);
  if (paidMinor === null) return { error: "errorAmount" };

  const today = todayInTimeZone(user.timezone);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const match = occurrencesInMonth(
    {
      id: obligation.id,
      amountMinor: obligation.amountMinor,
      cadence: obligation.cadence as ObligationCadence,
      dueDay: obligation.dueDay,
      weekday: obligation.weekday,
      startOn: obligation.startOn,
      endOn: obligation.endOn,
      paused: obligation.paused,
    },
    year,
    month,
  ).find((row) => row.periodKey === periodKey);
  if (!match) redirect("/plan");

  const existing = await prisma.obligationPayment.findUnique({
    where: { obligationId_periodKey: { obligationId: obligation.id, periodKey } },
  });
  if (existing) redirect("/plan");

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        userId: user.id,
        categoryId: obligation.categoryId,
        obligationId: obligation.id,
        amountMinor: paidMinor,
        note: obligation.name,
        paymentMethod: "cash",
        spentOn: match.dueOn > today ? today : match.dueOn,
      },
    });
    await tx.obligationPayment.create({
      data: {
        obligationId: obligation.id,
        periodKey,
        expenseId: expense.id,
        paidOn: today,
      },
    });
    if (obligation.amountMode === "variable" && paidMinor !== obligation.amountMinor) {
      await tx.obligation.update({
        where: { id: obligation.id },
        data: { amountMinor: paidMinor },
      });
    }
    if (obligation.loan) {
      await tx.loan.update({
        where: { id: obligation.loan.id },
        data: { remainingMinor: Math.max(0, obligation.loan.remainingMinor - paidMinor) },
      });
    }
  });

  refresh();
  redirect("/plan");
}

export async function undoObligationPaidAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const periodKey = String(formData.get("periodKey") ?? "");
  const obligation = await prisma.obligation.findFirst({
    where: { id, userId: user.id },
    include: { loan: true },
  });
  if (!obligation) redirect("/plan");

  const payment = await prisma.obligationPayment.findUnique({
    where: { obligationId_periodKey: { obligationId: obligation.id, periodKey } },
  });
  if (!payment) redirect("/plan");

  await prisma.$transaction(async (tx) => {
    if (payment.expenseId) {
      await tx.expense.deleteMany({ where: { id: payment.expenseId, userId: user.id } });
    }
    await tx.obligationPayment.delete({ where: { id: payment.id } });
    if (obligation.loan) {
      await tx.loan.update({
        where: { id: obligation.loan.id },
        data: { remainingMinor: obligation.loan.remainingMinor + obligation.amountMinor },
      });
    }
  });

  refresh();
  redirect("/plan");
}

export async function createLoanAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = loanSchema.safeParse({
    name: formData.get("name"),
    original: formData.get("original"),
    remaining: formData.get("remaining"),
    payment: formData.get("payment"),
    paymentDay: formData.get("paymentDay"),
    startOn: formData.get("startOn"),
    endOn: formData.get("endOn") ?? "",
    interest: formData.get("interest") ?? "",
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const originalMinor = parseAmountToMinor(parsed.data.original, user.currency);
  const remainingMinor = parseAmountToMinor(parsed.data.remaining, user.currency);
  const paymentMinor = parseAmountToMinor(parsed.data.payment, user.currency);
  const dueDay = parseDay(parsed.data.paymentDay);
  const interestBps = parseInterestBps(parsed.data.interest);
  if (originalMinor === null || remainingMinor === null || paymentMinor === null) return { error: "errorAmount" };
  if (dueDay === null || interestBps === null) return { error: "errorInvalid" };
  if (!isIsoDate(parsed.data.startOn)) return { error: "errorDate" };
  const endOn = parsed.data.endOn ? parsed.data.endOn : null;
  if (endOn && !isIsoDate(endOn)) return { error: "errorDate" };
  if (remainingMinor > originalMinor) return { error: "errorInvalid" };

  await prisma.$transaction(async (tx) => {
    const obligation = await tx.obligation.create({
      data: {
        userId: user.id,
        categoryId: await categoryIdFor(user.id, "loan"),
        name: parsed.data.name,
        amountMinor: paymentMinor,
        cadence: "monthly",
        dueDay,
        startOn: parsed.data.startOn,
        endOn,
        kind: "loan",
      },
    });
    await tx.loan.create({
      data: {
        userId: user.id,
        obligationId: obligation.id,
        originalMinor,
        remainingMinor,
        interestBps: interestBps === 0 ? null : interestBps,
        endOn,
      },
    });
  });

  refresh();
  redirect("/plan");
}

export async function updateSavingsTargetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = savingsTargetSchema.safeParse({ savings: formData.get("savings") ?? "" });
  if (!parsed.success) return { error: "errorInvalid" };
  const savings = parseOptionalMinor(parsed.data.savings, user.currency);
  if (savings === null) return { error: "errorAmount" };
  await prisma.user.update({ where: { id: user.id }, data: { savingsTargetMinor: savings } });
  refresh();
  redirect("/savings?saved=target");
}

export async function createGoalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    target: formData.get("target"),
    current: formData.get("current") ?? "",
    monthly: formData.get("monthly") ?? "",
    deadline: formData.get("deadline") ?? "",
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const targetMinor = parseAmountToMinor(parsed.data.target, user.currency);
  const currentMinor = parseOptionalMinor(parsed.data.current, user.currency);
  const monthlyContributionMinor = parseOptionalMinor(parsed.data.monthly, user.currency);
  if (targetMinor === null || currentMinor === null || monthlyContributionMinor === null) return { error: "errorAmount" };
  const deadline = parsed.data.deadline || null;
  if (deadline && !isIsoDate(deadline)) return { error: "errorDate" };

  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      targetMinor,
      currentMinor,
      monthlyContributionMinor,
      deadline,
    },
  });

  refresh();
  redirect("/savings");
}

export async function addGoalContributionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = contributionSchema.safeParse({ amount: formData.get("amount") });
  if (!parsed.success) return { error: "errorAmount" };
  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id, archived: false } });
  if (!goal) return { error: "errorNotFound" };

  await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { currentMinor: goal.currentMinor + amountMinor },
  });
  refresh();
  redirect("/savings");
}

export async function withdrawGoalContributionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = contributionSchema.safeParse({ amount: formData.get("amount") });
  if (!parsed.success) return { error: "errorAmount" };
  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };

  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id, archived: false } });
  if (!goal) return { error: "errorNotFound" };

  const nextMinor = applyGoalWithdrawal(goal.currentMinor, amountMinor);
  if (nextMinor === null) return { error: "errorWithdrawTooMuch" };

  await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { currentMinor: nextMinor },
  });
  refresh();
  redirect("/savings");
}

export async function deleteGoalAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.savingsGoal.deleteMany({ where: { id, userId: user.id } });
  refresh();
  redirect("/savings");
}

export async function upsertBudgetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    limit: formData.get("limit"),
  });
  if (!parsed.success) return { error: "errorInvalid" };
  const monthlyLimitMinor = parseAmountToMinor(parsed.data.limit, user.currency);
  if (monthlyLimitMinor === null) return { error: "errorAmount" };

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: user.id },
  });
  if (!category) return { error: "errorCategory" };

  await prisma.categoryBudget.upsert({
    where: { userId_categoryId: { userId: user.id, categoryId: category.id } },
    update: { monthlyLimitMinor },
    create: { userId: user.id, categoryId: category.id, monthlyLimitMinor },
  });
  refresh();
  redirect("/budgets");
}

export async function deleteBudgetAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.categoryBudget.deleteMany({ where: { id, userId: user.id } });
  refresh();
  redirect("/budgets");
}
