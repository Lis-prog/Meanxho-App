import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IncomeForm } from "@/components/money-forms";
import { Money } from "@/components/money";
import { prisma } from "@/lib/db";
import { formatMonthLabel, monthKey, monthRange, parseMonthParam, shiftMonth, todayInTimeZone, earliestMonth, clampMonth, compareMonths, monthFromIso } from "@/lib/dates";
import { summarizeControl } from "@/lib/finance";
import { categoryLabel, isLocale, paymentLabel, t, type Locale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { getCurrentUser } from "@/lib/current-user";
import { primaryButtonClass, quietButtonClass } from "@/lib/styles";
import type { Cadence, ObligationCadence } from "@/lib/categories";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const params = await searchParams;
  const today = todayInTimeZone(user.timezone);
  const selected = parseMonthParam(params.month, today);
  const range = monthRange(selected.year, selected.month);
  const current = monthKey(selected.year, selected.month) === today.slice(0, 7);
  const savedRaw = (await cookies()).get("menaxho_saved")?.value;
  let saved: { amountMinor: number; key: string; customName: string | null } | null = null;
  if (params.saved === "1" && savedRaw) {
    try {
      const parsed = JSON.parse(savedRaw) as { amountMinor?: number; key?: string; customName?: string | null };
      if (typeof parsed.amountMinor === "number" && typeof parsed.key === "string") {
        saved = { amountMinor: parsed.amountMinor, key: parsed.key, customName: parsed.customName ?? null };
      }
    } catch {
      saved = null;
    }
  }

  const [incomes, expenses, obligations, payments, budgets, categories, firstExpense, firstDatedIncome, firstObligation] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.expense.findMany({
      where: { userId: user.id, spentOn: { gte: range.start, lte: range.end } },
      include: { category: true },
      orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
    }),
    prisma.obligation.findMany({ where: { userId: user.id } }),
    prisma.obligationPayment.findMany({
      where: { obligation: { userId: user.id } },
      select: { obligationId: true, periodKey: true },
    }),
    prisma.categoryBudget.findMany({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.expense.findFirst({ where: { userId: user.id }, orderBy: { spentOn: "asc" }, select: { spentOn: true } }),
    prisma.income.findFirst({
      where: { userId: user.id, receivedOn: { not: null } },
      orderBy: { receivedOn: "asc" },
      select: { receivedOn: true },
    }),
    prisma.obligation.findFirst({ where: { userId: user.id }, orderBy: { startOn: "asc" }, select: { startOn: true } }),
  ]);

  const currentMonth = monthFromIso(today);
  const startMonth = earliestMonth(
    [
      todayInTimeZone(user.timezone, user.createdAt),
      firstExpense?.spentOn ?? "",
      firstDatedIncome?.receivedOn ?? "",
      firstObligation?.startOn ?? "",
    ],
    today,
  );
  const visible = clampMonth(selected, startMonth, currentMonth);
  if (monthKey(selected.year, selected.month) !== monthKey(visible.year, visible.month)) {
    redirect(`/dashboard?month=${monthKey(visible.year, visible.month)}`);
  }

  const categoryNames = new Map(categories.map((category) => [category.id, categoryLabel(locale, category)]));

  const summary = summarizeControl({
    year: selected.year,
    month: selected.month,
    today,
    savingsTargetMinor: user.savingsTargetMinor,
    incomes: incomes.map((income) => ({
      amountMinor: income.amountMinor,
      cadence: income.cadence as Cadence,
      active: income.active,
      receivedOn: income.receivedOn,
    })),
    expenses: expenses.map((expense) => ({
      amountMinor: expense.amountMinor,
      spentOn: expense.spentOn,
      categoryId: expense.categoryId,
    })),
    obligations: obligations.map((obligation) => ({
      id: obligation.id,
      amountMinor: obligation.amountMinor,
      cadence: obligation.cadence as ObligationCadence,
      dueDay: obligation.dueDay,
      weekday: obligation.weekday,
      startOn: obligation.startOn,
      endOn: obligation.endOn,
      paused: obligation.paused,
    })),
    payments,
    budgets: budgets.map((budget) => ({
      categoryId: budget.categoryId,
      monthlyLimitMinor: budget.monthlyLimitMinor,
    })),
  });

  const previous = shiftMonth(selected.year, selected.month, -1);
  const next = shiftMonth(selected.year, selected.month, 1);
  const canGoPrev = compareMonths(selected, startMonth) > 0;
  const canGoNext = compareMonths(selected, currentMonth) < 0;
  const names = new Map(expenses.map((expense) => [expense.categoryId, categoryLabel(locale, expense.category)]));
  const max = summary.byCategory[0]?.totalMinor ?? 1;
  const todayLeft = Math.max(0, summary.safeDailyMinor - (current ? summary.todaySpentMinor : 0));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <MonthLink
          href={`/dashboard?month=${monthKey(previous.year, previous.month)}`}
          label={t(locale, "prevMonth")}
          disabled={!canGoPrev}
        >
          ←
        </MonthLink>
        <h1 className="text-center font-serif text-2xl capitalize">{formatMonthLabel(selected.year, selected.month, locale)}</h1>
        <MonthLink
          href={`/dashboard?month=${monthKey(next.year, next.month)}`}
          label={t(locale, "nextMonth")}
          disabled={!canGoNext}
        >
          →
        </MonthLink>
      </div>

      {saved ? (
        <p role="status" className="rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pine-deep">
          {t(locale, "savedExpense", {
            amount: formatMinor(saved.amountMinor, user.currency, locale),
            category: categoryLabel(locale, saved),
          })}
        </p>
      ) : null}

      {summary.alerts.map((alert) => (
        <p
          key={alert.categoryId}
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm ${alert.level === "warn" ? "bg-pine-soft text-pine-deep" : "bg-danger-soft text-danger"}`}
        >
          {alert.level === "warn"
            ? t(locale, "alertWarn", { category: categoryNames.get(alert.categoryId) ?? "" })
            : alert.level === "hit"
              ? t(locale, "alertHit", { category: categoryNames.get(alert.categoryId) ?? "" })
              : t(locale, "alertOver", {
                  category: categoryNames.get(alert.categoryId) ?? "",
                  amount: formatMinor(alert.spentMinor - alert.limitMinor, user.currency, locale),
                })}
        </p>
      ))}

      {summary.incomeMinor === 0 ? (
        <section className="rounded-[28px] border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-serif text-4xl tracking-tight">{t(locale, "noIncomeTitle")}</h2>
          <p className="mt-3 max-w-lg text-muted">{t(locale, "noIncomeBody")}</p>
          <div className="mt-6 max-w-xl">
            <IncomeForm locale={locale} today={today} />
          </div>
        </section>
      ) : (
        <>
          <section>
            <p className="text-sm text-muted">{t(locale, "remaining")}</p>
            <p className="mt-2 font-serif text-5xl tracking-tight sm:text-7xl">
              <Money amountMinor={summary.remainingMinor} currency={user.currency} locale={locale} />
            </p>
            <p className="mt-3 text-muted">
              {t(locale, "ofIncome", { amount: formatMinor(summary.incomeMinor, user.currency, locale) })}
            </p>
            {summary.remainingMinor < 0 ? (
              <p className="mt-3 text-sm text-danger">
                {t(locale, "overBudget", { amount: formatMinor(Math.abs(summary.remainingMinor), user.currency, locale) })}
              </p>
            ) : summary.spentMinor === 0 ? (
              <p className="mt-3 text-sm text-muted">{t(locale, "stillFree")}</p>
            ) : null}
            <Link href="/add" className={`${primaryButtonClass} mt-6`}>
              {t(locale, "addExpense")}
            </Link>
          </section>

          {current ? (
            <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-6">
              <p className="text-sm text-muted">{t(locale, "safeToSpend")}</p>
              <p className="mt-2 font-serif text-4xl">
                <Money amountMinor={summary.safeDailyMinor} currency={user.currency} locale={locale} />
              </p>
              <p className="mt-3 text-sm text-muted">
                {summary.safeDailyMinor > 0
                  ? t(locale, "safeToSpendBody", {
                      amount: formatMinor(summary.safeDailyMinor, user.currency, locale),
                    })
                  : t(locale, "safeToSpendZero")}
              </p>
              <p className="mt-2 text-sm text-muted">
                {t(locale, "daysLeft", { count: summary.daysRemaining })} · {t(locale, "remainingToday")}:{" "}
                {formatMinor(todayLeft, user.currency, locale)}
              </p>
              <p className="mt-3 text-xs text-muted">{t(locale, "estimateNote")}</p>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t(locale, "income")} value={<Money amountMinor={summary.incomeMinor} currency={user.currency} locale={locale} />} href="/income" />
            <Stat label={t(locale, "spent")} value={<Money amountMinor={summary.spentMinor} currency={user.currency} locale={locale} />} />
            <Stat
              label={t(locale, "planned")}
              value={<Money amountMinor={summary.plannedUnpaidMinor} currency={user.currency} locale={locale} />}
              href="/plan"
            />
            <Stat
              label={current ? t(locale, "today") : t(locale, "navHistory")}
              value={
                current ? (
                  <Money amountMinor={summary.todaySpentMinor} currency={user.currency} locale={locale} />
                ) : (
                  <span className="tabular-nums">{expenses.length}</span>
                )
              }
            />
          </section>

          <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-2xl">{t(locale, "categories")}</h2>
            {summary.byCategory.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t(locale, "noSpending")}</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {summary.byCategory.map((row) => (
                  <li key={row.categoryId}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span>{names.get(row.categoryId)}</span>
                      <Money amountMinor={row.totalMinor} currency={user.currency} locale={locale} />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper">
                      <div className="h-full rounded-full bg-pine" style={{ width: `${Math.max(6, Math.round((row.totalMinor / max) * 100))}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-2xl">{t(locale, "recent")}</h2>
              <Link href="/transactions" className={quietButtonClass}>
                {t(locale, "seeAll")}
              </Link>
            </div>
            <ExpenseList locale={locale} currency={user.currency} expenses={expenses.slice(0, 5)} paymentLabel={(method) => paymentLabel(locale, method)} />
          </section>
        </>
      )}
    </div>
  );
}

function MonthLink({
  href,
  label,
  children,
  disabled,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const className = "grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-lg transition";
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} cursor-not-allowed opacity-35`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${className} cursor-pointer hover:border-ink hover:bg-white hover:shadow-[0_8px_18px_-12px_rgb(28_25_21_/_0.45)]`}>
      {children}
    </Link>
  );
}

function Stat({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const body = (
    <div className="rounded-3xl border border-line bg-surface px-4 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function ExpenseList({
  locale,
  currency,
  expenses,
  paymentLabel: pay,
}: {
  locale: Locale;
  currency: string;
  expenses: {
    id: string;
    amountMinor: number;
    note: string | null;
    spentOn: string;
    paymentMethod: string;
    category: { key: string; customName: string | null };
  }[];
  paymentLabel: (method: string) => string;
}) {
  if (expenses.length === 0) return <p className="text-sm text-muted">{t(locale, "noSpending")}</p>;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-surface">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <Link href={`/transactions/${expense.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-paper">
            <span>
              <span className="block font-medium">{categoryLabel(locale, expense.category)}</span>
              <span className="mt-1 block text-sm text-muted">
                {expense.note ? `${expense.note} · ` : ""}
                {expense.spentOn} · {pay(expense.paymentMethod)}
              </span>
            </span>
            <Money amountMinor={expense.amountMinor} currency={currency} locale={locale} className="font-serif text-xl" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
