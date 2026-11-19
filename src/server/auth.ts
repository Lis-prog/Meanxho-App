"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { CATEGORY_CATALOG } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { redirectBack } from "@/lib/locale";
import { rateLimit } from "@/lib/rate-limit";
import {
  LOCALE_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";
import {
  loginSchema,
  passwordSchema,
  registerSchema,
  type ActionState,
} from "@/lib/validators";

async function startSession(userId: string, sessionVersion: number, locale: string) {
  const token = await signSession(userId, sessionVersion);
  if (!token) return false;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions);
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return true;
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return { error: tooShort ? "errorPassword" : "errorInvalid" };
  }

  if (!rateLimit(`register:${parsed.data.email}`, 5, 60 * 60 * 1000)) {
    return { error: "errorRate" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          locale: parsed.data.locale,
          currency: parsed.data.currency,
          timezone: "Europe/Tirane",
        },
      });
      await tx.category.createMany({
        data: CATEGORY_CATALOG.map((item, index) => ({
          userId: created.id,
          key: item.key,
          groupKey: item.group,
          icon: item.icon,
          sortOrder: index,
        })),
      });
      return created;
    });

    const started = await startSession(user.id, user.sessionVersion, user.locale);
    if (!started) return { error: "errorGeneric" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "errorEmailTaken" };
    }
    return { error: "errorGeneric" };
  }

  redirect("/onboarding");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "errorCredentials" };

  if (!rateLimit(`login:${parsed.data.email}`, 8, 15 * 60 * 1000)) {
    return { error: "errorRate" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const hash = user?.passwordHash ?? (await dummyPasswordHash());
  const matches = await bcrypt.compare(parsed.data.password, hash);
  if (!user || !matches) return { error: "errorCredentials" };

  const started = await startSession(user.id, user.sessionVersion, user.locale);
  if (!started) return { error: "errorGeneric" };
  redirect(user.onboardingCompletedAt ? "/dashboard" : "/onboarding");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function requestResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!rateLimit(`reset:${email}`, 5, 60 * 60 * 1000)) return { error: "errorRate" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    const base = process.env.APP_ORIGIN ?? "http://localhost:3000";
    console.info(`[menaxho] Password reset link: ${base}/reset-password?token=${token}`);
  }

  return { notice: "forgotSent" };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!passwordSchema.safeParse(password).success || token.length < 32) {
    return { error: "errorPassword" };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.expiresAt.getTime() < Date.now()) return { error: "errorReset" };

  const user = await prisma.user.update({
    where: { id: row.userId },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      sessionVersion: { increment: 1 },
    },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const started = await startSession(user.id, user.sessionVersion, user.locale);
  if (!started) return { error: "errorGeneric" };
  redirect(user.onboardingCompletedAt ? "/dashboard" : "/onboarding");
}

export async function setLocaleAction(formData: FormData) {
  const locale = isLocale(String(formData.get("locale"))) ? String(formData.get("locale")) : "sq";
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const user = await getCurrentUser();
  if (user && user.locale !== locale) {
    await prisma.user.update({ where: { id: user.id }, data: { locale } });
  }

  await redirectBack("/");
}

let dummyHash: Promise<string> | null = null;

function dummyPasswordHash() {
  dummyHash ??= bcrypt.hash("not-a-user-password", 12);
  return dummyHash;
}
