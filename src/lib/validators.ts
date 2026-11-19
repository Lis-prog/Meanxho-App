import { z } from "zod";
import {
  BILL_KINDS,
  CURRENCIES,
  GROUP_KEYS,
  INCOME_KINDS,
  OBLIGATION_CADENCES,
  PAYMENT_METHODS,
  TIMEZONES,
} from "@/lib/categories";

export const passwordSchema = z
  .string()
  .min(10)
  .max(72)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: passwordSchema,
  locale: z.enum(["sq", "en"]),
  currency: z.enum(CURRENCIES),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const expenseSchema = z.object({
  amount: z.string().trim().min(1).max(20),
  categoryId: z.string().min(1).max(64),
  note: z.string().trim().max(160),
  spentOn: z.string().trim(),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const incomeSchema = z.object({
  amount: z.string().trim().min(1).max(20),
  kind: z.enum(INCOME_KINDS),
  cadence: z.enum(["monthly", "once"]),
  label: z.string().trim().max(80),
  receivedOn: z.string().trim(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  locale: z.enum(["sq", "en"]),
  currency: z.enum(CURRENCIES),
  timezone: z.enum(TIMEZONES),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  groupKey: z.enum(GROUP_KEYS),
});

export const obligationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.string().trim().min(1).max(20),
  cadence: z.enum(OBLIGATION_CADENCES),
  kind: z.enum(BILL_KINDS),
  amountMode: z.enum(["fixed", "variable"]),
  dueDay: z.string().trim(),
  weekday: z.string().trim(),
  startOn: z.string().trim(),
  endOn: z.string().trim(),
});

export const billAmountSchema = z.object({
  amount: z.string().trim().min(1).max(20),
  amountMode: z.enum(["fixed", "variable"]),
});

export const loanSchema = z.object({
  name: z.string().trim().min(1).max(80),
  original: z.string().trim().min(1).max(20),
  remaining: z.string().trim().min(1).max(20),
  payment: z.string().trim().min(1).max(20),
  paymentDay: z.string().trim().min(1).max(2),
  startOn: z.string().trim(),
  endOn: z.string().trim(),
  interest: z.string().trim().max(8),
});

export const goalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  target: z.string().trim().min(1).max(20),
  current: z.string().trim().max(20),
  monthly: z.string().trim().max(20),
  deadline: z.string().trim(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1).max(64),
  limit: z.string().trim().min(1).max(20),
});

export const onboardingSchema = z.object({
  income: z.string().trim().max(20),
  rent: z.string().trim().max(20),
  loanPayment: z.string().trim().max(20),
  loanRemaining: z.string().trim().max(20),
  subscription: z.string().trim().max(20),
  savings: z.string().trim().max(20),
});

export const savingsTargetSchema = z.object({
  savings: z.string().trim().max(20),
});

export const contributionSchema = z.object({
  amount: z.string().trim().min(1).max(20),
});

export type ActionState = {
  error?: string;
  notice?: string;
};
