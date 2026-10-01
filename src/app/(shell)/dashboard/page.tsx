import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IncomeForm } from "@/components/money-forms";
import { Money } from "@/components/money";
import { prisma } from "@/lib/db";
import { formatMonthLabel, monthKey, monthRange, parseMonthParam, shiftMonth, todayInTimeZone } from "@/lib/dates";
import { summarizeMonth } from "@/lib/finance";
import { categoryLabel, isLocale, paymentLabel, t, type Locale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { getCurrentUser } from "@/lib/current-user";
import { primaryButtonClass } from "@/lib/styles";
import type { Cadence } from "@/lib/categories";

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

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.expense.findMany({
      where: { userId: user.id, spentOn: { gte: range.start, lte: range.end } },
      include: { category: true },
      orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const summary = summarizeMonth({
    year: selected.year,
    month: selected.month,
    today,
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
  });

  const previous = shiftMonth(selected.year, selected.month, -1);
  const next = shiftMonth(selected.year, selected.month, 1);
  const names = new Map(expenses.map((expense) => [expense.categoryId, categoryLabel(locale, expense.category)]));
  const max = summary.byCategory[0]?.totalMinor ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <MonthLink
          href={`/dashboard?month=${monthKey(previous.year, previous.month)}`}
          label={t(locale, "prevMonth")}
        >
          ←
        </MonthLink>
        <h1 className="text-center font-serif text-2xl capitalize">{formatMonthLabel(selected.year, selected.month, locale)}</h1>
        <MonthLink href={`/dashboard?month=${monthKey(next.year, next.month)}`} label={t(locale, "nextMonth")}>
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

          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label={t(locale, "income")} value={<Money amountMinor={summary.incomeMinor} currency={user.currency} locale={locale} />} href="/income" />
            <Stat label={t(locale, "spent")} value={<Money amountMinor={summary.spentMinor} currency={user.currency} locale={locale} />} />
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
              <Link href="/transactions" className="text-sm font-medium text-pine-deep underline-offset-4 hover:underline">
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

function MonthLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-lg">
      {children}
    </Link>
  );
}

function Stat({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const body = (
    <div className="rounded-3xl border border-line bg-surface px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
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
