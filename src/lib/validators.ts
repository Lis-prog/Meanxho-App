import { z } from "zod";
import { CURRENCIES, GROUP_KEYS, INCOME_KINDS, PAYMENT_METHODS, TIMEZONES } from "@/lib/categories";

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

export type ActionState = {
  error?: string;
  notice?: string;
};
