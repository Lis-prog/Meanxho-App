import { redirect } from "next/navigation";
import { ExpenseForm } from "@/components/money-forms";
import { prisma } from "@/lib/db";
import { todayInTimeZone } from "@/lib/dates";
import { getCurrentUser } from "@/lib/current-user";
import { categoryLabel, isLocale, t, type Locale } from "@/lib/i18n";

export default async function AddPage() {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const categories = await prisma.category.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { sortOrder: "asc" },
  });
  const today = todayInTimeZone(user.timezone);

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="font-serif text-4xl tracking-tight">{t(locale, "addExpense")}</h1>
      <div className="mt-6 rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <ExpenseForm
          locale={locale}
          mode="create"
          categories={categories.map((category) => ({
            id: category.id,
            name: categoryLabel(locale, category),
            groupKey: category.groupKey,
          }))}
          defaults={{
            amount: "",
            categoryId: categories[0]?.id ?? "",
            note: "",
            spentOn: today,
            paymentMethod: "cash",
          }}
          today={today}
        />
      </div>
    </section>
  );
}
