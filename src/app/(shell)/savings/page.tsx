import { redirect } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Money } from "@/components/money";
import { ContributionForm, GoalForm, SavingsTargetForm, WithdrawForm } from "@/components/plan-forms";
import { prisma } from "@/lib/db";
import { formatDayLabel, todayInTimeZone } from "@/lib/dates";
import { estimateGoalCompletion } from "@/lib/finance";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale, t, type Locale } from "@/lib/i18n";
import { minorToInput } from "@/lib/money";
import { deleteGoalAction } from "@/server/plan";

export default async function SavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const params = await searchParams;
  const today = todayInTimeZone(user.timezone);
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">{t(locale, "savingsTitle")}</h1>
          <p className="mt-3 max-w-xl text-muted">{t(locale, "savingsBody")}</p>
        </div>
        {params.saved === "target" ? (
          <p role="status" className="rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pine-deep">
            {t(locale, "targetSaved")}
          </p>
        ) : null}
        <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="font-serif text-2xl">{t(locale, "savingsTarget")}</h2>
          <div className="mt-4">
            <SavingsTargetForm locale={locale} current={minorToInput(user.savingsTargetMinor, user.currency)} />
          </div>
        </section>
        {goals.length === 0 ? (
          <p className="text-sm text-muted">{t(locale, "noGoals")}</p>
        ) : (
          <ul className="space-y-4">
            {goals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.currentMinor / Math.max(goal.targetMinor, 1)) * 1000) / 10);
              const eta = estimateGoalCompletion({
                currentMinor: goal.currentMinor,
                targetMinor: goal.targetMinor,
                monthlyContributionMinor: goal.monthlyContributionMinor,
                today,
              });
              const done = goal.currentMinor >= goal.targetMinor;
              return (
                <li key={goal.id} className="rounded-[28px] border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {done
                          ? t(locale, "goalDone")
                          : t(locale, "goalProgress", { percent: String(percent) })}
                      </p>
                    </div>
                    <Money amountMinor={goal.currentMinor} currency={user.currency} locale={locale} className="font-serif text-2xl" />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    / <Money amountMinor={goal.targetMinor} currency={user.currency} locale={locale} />
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-pine" style={{ width: `${Math.max(4, percent)}%` }} />
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {done
                      ? t(locale, "goalDone")
                      : eta
                        ? t(locale, "goalEta", { date: formatDayLabel(eta, locale) })
                        : t(locale, "goalEtaUnknown")}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <ContributionForm locale={locale} id={goal.id} />
                    <WithdrawForm locale={locale} id={goal.id} currentMinor={goal.currentMinor} />
                  </div>
                  <div className="mt-3">
                    <ConfirmDelete locale={locale} action={deleteGoalAction} id={goal.id} messageKey="deleteGoalConfirm" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <aside className="h-fit rounded-[28px] border border-line bg-surface p-5">
        <h2 className="mb-4 font-serif text-2xl">{t(locale, "addGoal")}</h2>
        <GoalForm locale={locale} />
      </aside>
    </div>
  );
}
