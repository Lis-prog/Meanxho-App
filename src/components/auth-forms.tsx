"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction, requestResetAction, resetPasswordAction } from "@/server/auth";
import { CURRENCIES } from "@/lib/categories";
import { t, translateError, type Locale } from "@/lib/i18n";
import { inputClass, labelClass, primaryButtonClass, quietButtonClass } from "@/lib/styles";

function Alert({ locale, error }: { locale: Locale; error?: string }) {
  const message = translateError(locale, error);
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

export function LoginForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "email")}</span>
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "password")}</span>
        <input className={inputClass} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "loginTitle")}
      </button>
    </form>
  );
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(registerAction, {});

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "name")}</span>
        <input className={inputClass} name="name" autoComplete="name" required maxLength={80} />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "email")}</span>
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "password")}</span>
        <input className={inputClass} name="password" type="password" autoComplete="new-password" required minLength={10} />
        <span className="mt-2 block text-sm text-muted">{t(locale, "passwordHint")}</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t(locale, "language")}</span>
          <select className={inputClass} name="locale" defaultValue={locale}>
            <option value="sq">{t(locale, "albanian")}</option>
            <option value="en">{t(locale, "english")}</option>
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "currency")}</span>
          <select className={inputClass} name="currency" defaultValue="EUR">
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "createAccount")}
      </button>
    </form>
  );
}

export function ForgotForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(requestResetAction, {});
  const notice = state.notice ? t(locale, "forgotSent") : null;

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      {notice ? (
        <p role="status" className="rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pine-deep">
          {notice}
        </p>
      ) : null}
      <label className="block">
        <span className={labelClass}>{t(locale, "email")}</span>
        <input className={inputClass} name="email" type="email" autoComplete="email" required />
      </label>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "sendLink")}
      </button>
    </form>
  );
}

export function ResetForm({ locale, token }: { locale: Locale; token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "newPassword")}</span>
        <input className={inputClass} name="password" type="password" autoComplete="new-password" required minLength={10} />
      </label>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "savePassword")}
      </button>
    </form>
  );
}

export function AuthLinks({ locale, mode }: { locale: Locale; mode: "login" | "register" }) {
  return (
    <p className="text-sm text-muted">
      {mode === "login" ? (
        <>
          {t(locale, "noAccount")}{" "}
          <Link className="font-semibold text-ink underline-offset-4 hover:underline" href="/register">
            {t(locale, "createAccount")}
          </Link>
        </>
      ) : (
        <>
          {t(locale, "hasAccount")}{" "}
          <Link className="font-semibold text-ink underline-offset-4 hover:underline" href="/login">
            {t(locale, "loginTitle")}
          </Link>
        </>
      )}
    </p>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${quietButtonClass} w-full`}>
      {children}
    </Link>
  );
}
