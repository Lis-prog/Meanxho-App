import { redirect } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Money } from "@/components/money";
import { LoanForm, MarkPaidForm, ObligationForm, UpdateBillForm } from "@/components/plan-forms";
import { prisma } from "@/lib/db";
import { todayInTimeZone } from "@/lib/dates";
import { getCurrentUser } from "@/lib/current-user";
import { categoryLabel, isLocale, obligationKindLabel, t, type Locale } from "@/lib/i18n";
import { occurrencesInMonth } from "@/lib/plan";
import {
  deleteObligationAction,
  toggleObligationAction,
  undoObligationPaidAction,
} from "@/server/plan";
import type { ObligationCadence } from "@/lib/categories";
import { minorToInput } from "@/lib/money";
import { quietButtonClass } from "@/lib/styles";

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const today = todayInTimeZone(user.timezone);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  const [obligations, categories, payments] = await Promise.all([
    prisma.obligation.findMany({
      where: { userId: user.id },
      include: { category: true, loan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { userId: user.id, archived: false }, orderBy: { sortOrder: "asc" } }),
    prisma.obligationPayment.findMany({
      where: { obligation: { userId: user.id } },
      select: { obligationId: true, periodKey: true },
    }),
  ]);

  const paid = new Set(payments.map((row) => `${row.obligationId}:${row.periodKey}`));
  const loans = obligations.filter((item) => item.loan);
  const bills = obligations.filter((item) => !item.loan);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">{t(locale, "planTitle")}</h1>
          <p className="mt-3 max-w-xl text-muted">{t(locale, "planBody")}</p>
          {bills.length === 0 ? (
            <p className="mt-8 text-sm text-muted">{t(locale, "noObligations")}</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {bills.map((obligation) => (
                <ObligationCard
                  key={obligation.id}
                  locale={locale}
                  currency={user.currency}
                  obligation={obligation}
                  occurrences={occurrencesInMonth(
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
                  )}
                  paid={paid}
                />
              ))}
            </ul>
          )}
        </div>
        <aside className="h-fit rounded-[28px] border border-line bg-surface p-5">
          <h2 className="mb-4 font-serif text-2xl">{t(locale, "addObligation")}</h2>
          <ObligationForm
            locale={locale}
            today={today}
            categories={categories.map((category) => ({
              id: category.id,
              name: categoryLabel(locale, category),
              groupKey: category.groupKey,
              key: category.key,
            }))}
          />
        </aside>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h2 className="font-serif text-3xl tracking-tight">{t(locale, "loansTitle")}</h2>
          <p className="mt-3 max-w-xl text-muted">{t(locale, "loansBody")}</p>
          {loans.length === 0 ? (
            <p className="mt-8 text-sm text-muted">{t(locale, "noLoans")}</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {loans.map((obligation) => (
                <ObligationCard
                  key={obligation.id}
                  locale={locale}
                  currency={user.currency}
                  obligation={obligation}
                  occurrences={occurrencesInMonth(
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
                  )}
                  paid={paid}
                  loan
                />
              ))}
            </ul>
          )}
        </div>
        <aside className="h-fit rounded-[28px] border border-line bg-surface p-5">
          <h2 className="mb-4 font-serif text-2xl">{t(locale, "addLoan")}</h2>
          <LoanForm locale={locale} today={today} />
        </aside>
      </section>
    </div>
  );
}

function ObligationCard({
  locale,
  currency,
  obligation,
  occurrences,
  paid,
  loan,
}: {
  locale: Locale;
  currency: string;
  obligation: {
    id: string;
    name: string;
    amountMinor: number;
    amountMode: string;
    cadence: string;
    kind: string;
    paused: boolean;
    loan: { remainingMinor: number; originalMinor: number } | null;
    category: { key: string; customName: string | null };
  };
  occurrences: { periodKey: string; dueOn: string; amountMinor: number }[];
  paid: Set<string>;
  loan?: boolean;
}) {
  const variable = obligation.amountMode === "variable";
  return (
    <li className="rounded-[28px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{obligation.name}</p>
          <p className="mt-1 text-sm text-muted">
            {obligationKindLabel(locale, obligation.kind)}
            {obligation.kind === "other" ? ` · ${categoryLabel(locale, obligation.category)}` : ""}
            {" · "}
            {t(locale, obligation.cadence === "weekly" ? "weekly" : obligation.cadence === "yearly" ? "yearly" : "monthly")}
            {variable ? ` · ${t(locale, "amountChanges")}` : ""}
            {obligation.paused ? ` · ${t(locale, "paused")}` : ""}
          </p>
          {obligation.loan ? (
            <p className="mt-2 text-sm text-muted">
              {t(locale, "remainingBalance")}:{" "}
              <Money amountMinor={obligation.loan.remainingMinor} currency={currency} locale={locale} />
            </p>
          ) : null}
        </div>
        <Money amountMinor={obligation.amountMinor} currency={currency} locale={locale} className="font-serif text-2xl" />
      </div>
      <ul className="mt-4 space-y-3">
        {occurrences.length === 0 ? (
          <li className="text-sm text-muted">{t(locale, "dueThisPeriod")}: —</li>
        ) : (
          occurrences.map((row) => {
            const isPaid = paid.has(`${obligation.id}:${row.periodKey}`);
            return (
              <li key={row.periodKey} className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm">
                  {row.dueOn} · {isPaid ? t(locale, "paidThisPeriod") : t(locale, "dueThisPeriod")}
                </span>
                {isPaid ? (
                  <form action={undoObligationPaidAction}>
                    <input type="hidden" name="id" value={obligation.id} />
                    <input type="hidden" name="periodKey" value={row.periodKey} />
                    <button className={quietButtonClass} type="submit">
                      {t(locale, "undoPaid")}
                    </button>
                  </form>
                ) : (
                  <MarkPaidForm
                    locale={locale}
                    id={obligation.id}
                    periodKey={row.periodKey}
                    variable={variable}
                    amount={minorToInput(obligation.amountMinor, currency)}
                  />
                )}
              </li>
            );
          })
        )}
      </ul>
      {loan ? null : (
        <UpdateBillForm
          locale={locale}
          id={obligation.id}
          amount={minorToInput(obligation.amountMinor, currency)}
          amountMode={variable ? "variable" : "fixed"}
        />
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form action={toggleObligationAction}>
          <input type="hidden" name="id" value={obligation.id} />
          <button className={quietButtonClass} type="submit">
            {obligation.paused ? t(locale, "resume") : t(locale, "pause")}
          </button>
        </form>
        <ConfirmDelete
          locale={locale}
          action={deleteObligationAction}
          id={obligation.id}
          messageKey={loan ? "deleteLoanConfirm" : "deleteObligationConfirm"}
        />
      </div>
    </li>
  );
}
