"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isIsoDate, isReasonableExpenseDate, todayInTimeZone } from "@/lib/dates";
import { parseAmountToMinor } from "@/lib/money";
import { getCurrentUser } from "@/lib/current-user";
import {
  categorySchema,
  expenseSchema,
  incomeSchema,
  profileSchema,
  type ActionState,
} from "@/lib/validators";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/api/session/end");
  return user;
}

function refreshMoney() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/income");
  revalidatePath("/add");
  revalidatePath("/settings");
  revalidatePath("/plan");
  revalidatePath("/savings");
  revalidatePath("/budgets");
  revalidatePath("/reports");
}

export async function createExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    note: formData.get("note") ?? "",
    spentOn: formData.get("spentOn"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };

  const today = todayInTimeZone(user.timezone);
  if (!isReasonableExpenseDate(parsed.data.spentOn, today)) return { error: "errorDate" };

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: user.id, archived: false },
  });
  if (!category) return { error: "errorCategory" };

  await prisma.expense.create({
    data: {
      userId: user.id,
      categoryId: category.id,
      amountMinor,
      note: parsed.data.note || null,
      paymentMethod: parsed.data.paymentMethod,
      spentOn: parsed.data.spentOn,
    },
  });

  const jar = await cookies();
  jar.set(
    "menaxho_saved",
    JSON.stringify({
      amountMinor,
      key: category.key,
      customName: category.customName,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30,
    },
  );

  refreshMoney();
  redirect("/dashboard?saved=1");
}

export async function updateExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = expenseSchema.safeParse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    note: formData.get("note") ?? "",
    spentOn: formData.get("spentOn"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };
  const today = todayInTimeZone(user.timezone);
  if (!isReasonableExpenseDate(parsed.data.spentOn, today)) return { error: "errorDate" };

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: user.id, archived: false },
  });
  if (!category) return { error: "errorCategory" };

  const updated = await prisma.expense.updateMany({
    where: { id, userId: user.id },
    data: {
      categoryId: category.id,
      amountMinor,
      note: parsed.data.note || null,
      paymentMethod: parsed.data.paymentMethod,
      spentOn: parsed.data.spentOn,
    },
  });
  if (updated.count !== 1) return { error: "errorNotFound" };

  refreshMoney();
  redirect("/transactions");
}

export async function deleteExpenseAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.expense.deleteMany({ where: { id, userId: user.id } });
  refreshMoney();
  redirect("/transactions");
}

export async function createIncomeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = incomeSchema.safeParse({
    amount: formData.get("amount"),
    kind: formData.get("kind"),
    cadence: formData.get("cadence"),
    label: formData.get("label") ?? "",
    receivedOn: formData.get("receivedOn") ?? "",
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const amountMinor = parseAmountToMinor(parsed.data.amount, user.currency);
  if (amountMinor === null) return { error: "errorAmount" };

  const today = todayInTimeZone(user.timezone);
  const receivedOn = parsed.data.cadence === "once" ? parsed.data.receivedOn : null;
  if (parsed.data.cadence === "once" && !isReasonableExpenseDate(receivedOn ?? "", today)) {
    return { error: "errorDate" };
  }
  if (receivedOn && !isIsoDate(receivedOn)) return { error: "errorDate" };

  await prisma.income.create({
    data: {
      userId: user.id,
      amountMinor,
      kind: parsed.data.kind,
      cadence: parsed.data.cadence,
      label: parsed.data.label || null,
      receivedOn,
      active: true,
    },
  });

  refreshMoney();
  redirect("/dashboard");
}

export async function toggleIncomeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const income = await prisma.income.findFirst({ where: { id, userId: user.id } });
  if (!income) redirect("/income");
  await prisma.income.update({ where: { id: income.id }, data: { active: !income.active } });
  refreshMoney();
  redirect("/income");
}

export async function deleteIncomeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.income.deleteMany({ where: { id, userId: user.id } });
  refreshMoney();
  redirect("/income");
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    locale: formData.get("locale"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return { error: "errorInvalid" };

  if (parsed.data.currency !== user.currency) {
    const [expenses, incomes, obligations] = await Promise.all([
      prisma.expense.count({ where: { userId: user.id } }),
      prisma.income.count({ where: { userId: user.id } }),
      prisma.obligation.count({ where: { userId: user.id } }),
    ]);
    if (expenses + incomes + obligations > 0) return { error: "errorCurrencyLocked" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  const jar = await cookies();
  jar.set("menaxho_locale", parsed.data.locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  refreshMoney();
  redirect("/settings?saved=profile");
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    groupKey: formData.get("groupKey"),
  });
  if (!parsed.success) return { error: "errorInvalid" };

  const last = await prisma.category.findFirst({
    where: { userId: user.id },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.category.create({
    data: {
      userId: user.id,
      key: `custom_${randomUUID()}`,
      customName: parsed.data.name,
      groupKey: parsed.data.groupKey,
      icon: "dot",
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  refreshMoney();
  redirect("/settings?saved=category");
}

export async function toggleCategoryAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const category = await prisma.category.findFirst({ where: { id, userId: user.id } });
  if (!category) redirect("/settings");

  if (!category.archived) {
    const activeCount = await prisma.category.count({ where: { userId: user.id, archived: false } });
    if (activeCount <= 1) redirect("/settings?error=last");
  }

  await prisma.category.update({
    where: { id: category.id },
    data: { archived: !category.archived },
  });
  refreshMoney();
  redirect("/settings");
}

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const confirmEmail = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (confirmEmail !== user.email) return { error: "errorConfirmEmail" };
  await prisma.user.delete({ where: { id: user.id } });
  redirect("/api/session/end?next=/");
}
