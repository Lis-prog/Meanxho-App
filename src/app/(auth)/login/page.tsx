import Link from "next/link";
import { AuthLinks, LoginForm } from "@/components/auth-forms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function LoginPage() {
  const locale = await readLocale();

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">{t(locale, "loginTitle")}</h1>
      <LoginForm locale={locale} />
      <AuthLinks locale={locale} mode="login" />
      <Link href="/forgot-password" className="text-sm font-medium text-pine-deep underline-offset-4 hover:underline">
        {t(locale, "forgot")}
      </Link>
    </section>
  );
}
