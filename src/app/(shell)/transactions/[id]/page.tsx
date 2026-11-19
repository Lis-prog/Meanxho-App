import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { ConfirmDelete } from "@/components/confirm-delete";
import { ExpenseForm } from "@/components/money-forms";
import { prisma } from "@/lib/db";
import { todayInTimeZone } from "@/lib/dates";
import { getCurrentUser } from "@/lib/current-user";
import { categoryLabel, isLocale, t, type Locale } from "@/lib/i18n";
import { minorToInput } from "@/lib/money";
import { deleteExpenseAction } from "@/server/finance";
import type { PaymentMethod } from "@/lib/categories";
import { PAYMENT_METHODS } from "@/lib/categories";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;
  const today = todayInTimeZone(user.timezone);
  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    include: { category: true },
  });
  if (!expense) notFound();

  const categories = await prisma.category.findMany({
    where: { userId: user.id, OR: [{ archived: false }, { id: expense.categoryId }] },
    orderBy: { sortOrder: "asc" },
  });
  const method = PAYMENT_METHODS.find((item) => item === expense.paymentMethod) ?? "cash";

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/transactions" label={t(locale, "back")} />
        <ConfirmDelete locale={locale} action={deleteExpenseAction} id={expense.id} messageKey="deleteConfirm" />
      </div>
      <h1 className="font-serif text-4xl tracking-tight">{t(locale, "editExpense")}</h1>
      <div className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <ExpenseForm
          locale={locale}
          mode="edit"
          categories={categories.map((category) => ({
            id: category.id,
            name: categoryLabel(locale, category),
            groupKey: category.groupKey,
          }))}
          defaults={{
            id: expense.id,
            amount: minorToInput(expense.amountMinor, user.currency),
            categoryId: expense.categoryId,
            note: expense.note ?? "",
            spentOn: expense.spentOn,
            paymentMethod: method as PaymentMethod,
          }}
          today={today}
        />
      </div>
    </section>
  );
}
