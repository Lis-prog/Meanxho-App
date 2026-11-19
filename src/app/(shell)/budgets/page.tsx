import { redirect } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Money } from "@/components/money";
import { BudgetForm } from "@/components/plan-forms";
import { prisma } from "@/lib/db";
import { monthRange, todayInTimeZone } from "@/lib/dates";
import { getCurrentUser } from "@/lib/current-user";
import { categoryLabel, isLocale, t, type Locale } from "@/lib/i18n";
import { deleteBudgetAction } from "@/server/plan";

export default async function BudgetsPage() {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const today = todayInTimeZone(user.timezone);
  const range = monthRange(Number(today.slice(0, 4)), Number(today.slice(5, 7)));

  const [categories, budgets, expenses] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id, archived: false }, orderBy: { sortOrder: "asc" } }),
    prisma.categoryBudget.findMany({ where: { userId: user.id }, include: { category: true } }),
    prisma.expense.findMany({
      where: { userId: user.id, spentOn: { gte: range.start, lte: range.end } },
      select: { categoryId: true, amountMinor: true },
    }),
  ]);

  const spent = new Map<string, number>();
  for (const expense of expenses) {
    spent.set(expense.categoryId, (spent.get(expense.categoryId) ?? 0) + expense.amountMinor);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "budgetsTitle")}</h1>
        <p className="mt-3 max-w-xl text-muted">{t(locale, "budgetsBody")}</p>
        {budgets.length === 0 ? (
          <p className="mt-8 text-sm text-muted">{t(locale, "noBudgets")}</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {budgets.map((budget) => {
              const used = spent.get(budget.categoryId) ?? 0;
              const percent = Math.min(100, Math.round((used / Math.max(budget.monthlyLimitMinor, 1)) * 100));
              return (
                <li key={budget.id} className="rounded-[28px] border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{categoryLabel(locale, budget.category)}</p>
                      <p className="mt-1 text-sm text-muted">
                        <Money amountMinor={used} currency={user.currency} locale={locale} /> /{" "}
                        <Money amountMinor={budget.monthlyLimitMinor} currency={user.currency} locale={locale} />
                      </p>
                    </div>
                    <ConfirmDelete locale={locale} action={deleteBudgetAction} id={budget.id} messageKey="deleteBudgetConfirm" />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                    <div className={`h-full rounded-full ${percent >= 100 ? "bg-danger" : "bg-pine"}`} style={{ width: `${Math.max(4, percent)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <aside className="h-fit rounded-[28px] border border-line bg-surface p-5">
        <h2 className="mb-4 font-serif text-2xl">{t(locale, "saveBudget")}</h2>
        <BudgetForm
          locale={locale}
          categories={categories.map((category) => ({
            id: category.id,
            name: categoryLabel(locale, category),
            groupKey: category.groupKey,
          }))}
        />
      </aside>
    </div>
  );
}
