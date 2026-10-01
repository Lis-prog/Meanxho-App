import { redirect } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { IncomeForm } from "@/components/money-forms";
import { Money } from "@/components/money";
import { prisma } from "@/lib/db";
import { todayInTimeZone } from "@/lib/dates";
import { getCurrentUser } from "@/lib/current-user";
import { incomeKindLabel, isLocale, t, type Locale } from "@/lib/i18n";
import { deleteIncomeAction, toggleIncomeAction } from "@/server/finance";

export default async function IncomePage() {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const today = todayInTimeZone(user.timezone);
  const incomes = await prisma.income.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "incomeTitle")}</h1>
        <p className="mt-3 max-w-xl text-muted">{t(locale, "incomeBody")}</p>
        {incomes.length === 0 ? (
          <p className="mt-8 text-sm text-muted">{t(locale, "noIncomes")}</p>
        ) : (
          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-surface">
            {incomes.map((income) => (
              <li key={income.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                  <p className="font-medium">
                    {income.label || incomeKindLabel(locale, income.kind)}
                    <span className="ml-2 text-sm font-normal text-muted">
                      {income.cadence === "monthly" ? t(locale, "monthly") : income.receivedOn}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{income.active ? t(locale, "active") : t(locale, "paused")}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Money amountMinor={income.amountMinor} currency={user.currency} locale={locale} className="font-serif text-2xl" />
                  <form action={toggleIncomeAction}>
                    <input type="hidden" name="id" value={income.id} />
                    <button className="text-sm font-medium underline-offset-4 hover:underline" type="submit">
                      {income.active ? t(locale, "pause") : t(locale, "resume")}
                    </button>
                  </form>
                  <ConfirmDelete locale={locale} action={deleteIncomeAction} id={income.id} messageKey="deleteIncomeConfirm" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="h-fit rounded-[28px] border border-line bg-surface p-5">
        <h2 className="mb-4 font-serif text-2xl">{t(locale, "addIncome")}</h2>
        <IncomeForm locale={locale} today={today} />
      </aside>
    </section>
  );
}
