import Link from "next/link";
import { redirect } from "next/navigation";
import { Money } from "@/components/money";
import { prisma } from "@/lib/db";
import { isIsoDate } from "@/lib/dates";
import { getCurrentUser } from "@/lib/current-user";
import { PAYMENT_METHODS } from "@/lib/categories";
import { categoryLabel, isLocale, paymentLabel, t, type Locale } from "@/lib/i18n";
import { inputClass, labelClass, primaryButtonClass, quietButtonClass } from "@/lib/styles";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; method?: string; from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 80);
  const from = params.from && isIsoDate(params.from) ? params.from : undefined;
  const to = params.to && isIsoDate(params.to) ? params.to : undefined;
  const method = PAYMENT_METHODS.find((item) => item === params.method);

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });
  const category = categories.find((item) => item.id === params.category);
  const namedMatches = q
    ? categories
        .filter((item) => categoryLabel(locale, item).toLocaleLowerCase(locale === "sq" ? "sq" : "en").includes(q.toLocaleLowerCase(locale === "sq" ? "sq" : "en")))
        .map((item) => item.id)
    : [];

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      ...(category ? { categoryId: category.id } : {}),
      ...(method ? { paymentMethod: method } : {}),
      ...(from || to
        ? {
            spentOn: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { note: { contains: q, mode: "insensitive" } },
              ...(namedMatches.length > 0 ? [{ categoryId: { in: namedMatches } }] : []),
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">{t(locale, "historyTitle")}</h1>
      <form className="grid gap-3 rounded-[28px] border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6" action="/transactions">
        <label className="block lg:col-span-2">
          <span className={labelClass}>{t(locale, "search")}</span>
          <input className={inputClass} name="q" defaultValue={q} placeholder={t(locale, "searchPlaceholder")} />
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "category")}</span>
          <select className={inputClass} name="category" defaultValue={category?.id ?? ""}>
            <option value="">{t(locale, "allCategories")}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {categoryLabel(locale, item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "payment")}</span>
          <select className={inputClass} name="method" defaultValue={method ?? ""}>
            <option value="">{t(locale, "allPayments")}</option>
            {PAYMENT_METHODS.map((item) => (
              <option key={item} value={item}>
                {paymentLabel(locale, item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "from")}</span>
          <input className={inputClass} type="date" name="from" defaultValue={from ?? ""} />
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "to")}</span>
          <input className={inputClass} type="date" name="to" defaultValue={to ?? ""} />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button className={primaryButtonClass} type="submit">
            {t(locale, "apply")}
          </button>
          <Link href="/transactions" className={quietButtonClass}>
            {t(locale, "clear")}
          </Link>
        </div>
      </form>

      {expenses.length === 200 ? <p className="text-sm text-muted">{t(locale, "resultCap")}</p> : null}

      {expenses.length === 0 ? (
        <p className="rounded-[28px] border border-dashed border-line px-4 py-10 text-center text-muted">{t(locale, "emptyHistory")}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-surface">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <Link href={`/transactions/${expense.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-paper">
                <span>
                  <span className="block font-medium">{categoryLabel(locale, expense.category)}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {expense.note ? `${expense.note} · ` : ""}
                    {expense.spentOn} · {paymentLabel(locale, expense.paymentMethod)}
                  </span>
                </span>
                <Money amountMinor={expense.amountMinor} currency={user.currency} locale={locale} className="font-serif text-xl" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
