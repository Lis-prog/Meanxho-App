import { redirect } from "next/navigation";
import { CategoryForm, DeleteAccountForm, ProfileForm } from "@/components/money-forms";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { categoryLabel, groupLabel, isLocale, t, type Locale } from "@/lib/i18n";
import { toggleCategoryAction } from "@/server/finance";
import { TIMEZONES } from "@/lib/categories";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const params = await searchParams;
  const [expenseCount, incomeCount, categories] = await Promise.all([
    prisma.expense.count({ where: { userId: user.id } }),
    prisma.income.count({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: [{ archived: "asc" }, { sortOrder: "asc" }] }),
  ]);
  const timezone = TIMEZONES.find((zone) => zone === user.timezone) ?? "Europe/Belgrade";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-serif text-4xl tracking-tight">{t(locale, "settingsTitle")}</h1>
      {params.saved === "profile" ? <Notice>{t(locale, "profileSaved")}</Notice> : null}
      {params.saved === "category" ? <Notice>{t(locale, "categorySaved")}</Notice> : null}
      {params.error === "last" ? (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {t(locale, "errorLastCategory")}
        </p>
      ) : null}

      <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <ProfileForm
          locale={locale}
          name={user.name}
          currency={user.currency}
          timezone={timezone}
          currencyLocked={expenseCount + incomeCount > 0}
        />
      </section>

      <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <h2 className="font-serif text-2xl">{t(locale, "categoriesTitle")}</h2>
        <div className="mt-5">
          <CategoryForm locale={locale} />
        </div>
        <ul className="mt-6 divide-y divide-line">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="font-medium">{categoryLabel(locale, category)}</span>
                <span className="ml-2 text-sm text-muted">
                  {groupLabel(locale, category.groupKey)}
                  {category.archived ? ` · ${t(locale, "hidden")}` : ""}
                </span>
              </span>
              <form action={toggleCategoryAction}>
                <input type="hidden" name="id" value={category.id} />
                <button className="text-sm font-medium underline-offset-4 hover:underline" type="submit">
                  {category.archived ? t(locale, "unarchive") : t(locale, "archive")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[28px] border border-danger/30 bg-danger-soft p-5 sm:p-7">
        <h2 className="font-serif text-2xl text-danger">{t(locale, "dangerZone")}</h2>
        <p className="mt-2 text-sm text-danger">{t(locale, "dangerBody")}</p>
        <div className="mt-5">
          <DeleteAccountForm locale={locale} />
        </div>
      </section>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p role="status" className="rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pine-deep">{children}</p>;
}
