import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { ExpenseForm } from "@/components/money-forms";
import { prisma } from "@/lib/db";
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
      <Link href="/transactions" className="text-sm font-medium text-muted underline-offset-4 hover:underline">
        {t(locale, "back")}
      </Link>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "editExpense")}</h1>
        <ConfirmDelete locale={locale} action={deleteExpenseAction} id={expense.id} messageKey="deleteConfirm" />
      </div>
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
        />
      </div>
    </section>
  );
}
