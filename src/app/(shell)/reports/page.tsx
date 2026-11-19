import { redirect } from "next/navigation";
import { Money } from "@/components/money";
import { ScenarioForm } from "@/components/plan-forms";
import { prisma } from "@/lib/db";
import { monthRange, todayInTimeZone, weekRangeContaining } from "@/lib/dates";
import { savingsRate, scenarioAnnualMinor, summarizeMonth } from "@/lib/finance";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { parseAmountToMinor, formatMinor } from "@/lib/money";
import type { Cadence } from "@/lib/categories";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ less?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const params = await searchParams;
  const today = todayInTimeZone(user.timezone);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const monthSpan = monthRange(year, month);
  const week = weekRangeContaining(today);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [incomes, monthExpenses, weekExpenses, yearExpenses] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.expense.findMany({ where: { userId: user.id, spentOn: { gte: monthSpan.start, lte: monthSpan.end } } }),
    prisma.expense.findMany({ where: { userId: user.id, spentOn: { gte: week.start, lte: week.end } } }),
    prisma.expense.findMany({ where: { userId: user.id, spentOn: { gte: yearStart, lte: yearEnd } } }),
  ]);

  const monthSummary = summarizeMonth({
    year,
    month,
    today,
    incomes: incomes.map((income) => ({
      amountMinor: income.amountMinor,
      cadence: income.cadence as Cadence,
      active: income.active,
      receivedOn: income.receivedOn,
    })),
    expenses: monthExpenses.map((expense) => ({
      amountMinor: expense.amountMinor,
      spentOn: expense.spentOn,
      categoryId: expense.categoryId,
    })),
  });

  const weekSpent = weekExpenses.reduce((sum, row) => sum + row.amountMinor, 0);
  let yearIncome = 0;
  for (let currentMonth = 1; currentMonth <= 12; currentMonth += 1) {
    yearIncome += summarizeMonth({
      year,
      month: currentMonth,
      today,
      incomes: incomes.map((income) => ({
        amountMinor: income.amountMinor,
        cadence: income.cadence as Cadence,
        active: income.active,
        receivedOn: income.receivedOn,
      })),
      expenses: [],
    }).incomeMinor;
  }
  const yearSpent = yearExpenses.reduce((sum, row) => sum + row.amountMinor, 0);
  const yearLeft = yearIncome - yearSpent;
  const rate = savingsRate(monthSummary.incomeMinor, monthSummary.remainingMinor);
  const less = params.less ? parseAmountToMinor(params.less, user.currency) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "reportsTitle")}</h1>
        <p className="mt-3 text-muted">{t(locale, "estimateNote")}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t(locale, "weekSpent")} value={<Money amountMinor={weekSpent} currency={user.currency} locale={locale} />} />
        <Stat label={t(locale, "spent")} value={<Money amountMinor={monthSummary.spentMinor} currency={user.currency} locale={locale} />} />
        <Stat label={t(locale, "yearSpent")} value={<Money amountMinor={yearSpent} currency={user.currency} locale={locale} />} />
        <Stat label={t(locale, "yearSaved")} value={<Money amountMinor={yearLeft} currency={user.currency} locale={locale} />} />
      </section>

      <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <h2 className="font-serif text-2xl">{t(locale, "healthTitle")}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">{t(locale, "savingsRate")}</dt>
            <dd className="mt-1 font-serif text-2xl">{rate === null ? "—" : `${Math.round(rate * 100)}%`}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t(locale, "yearIncome")}</dt>
            <dd className="mt-1 font-serif text-2xl">
              <Money amountMinor={yearIncome} currency={user.currency} locale={locale} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t(locale, "thisWeek")}</dt>
            <dd className="mt-1 font-serif text-2xl">
              {week.start} – {week.end}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <h2 className="font-serif text-2xl">{t(locale, "scenarioTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t(locale, "scenarioBody")}</p>
        <div className="mt-5">
          <ScenarioForm locale={locale} />
        </div>
        {less ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Stat label={t(locale, "scenarioMonth")} value={<Money amountMinor={less} currency={user.currency} locale={locale} />} />
            <Stat
              label={t(locale, "scenarioYear")}
              value={<Money amountMinor={scenarioAnnualMinor(less)} currency={user.currency} locale={locale} />}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {t(locale, "scenarioBody")} {formatMinor(0, user.currency, locale)}
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
}
