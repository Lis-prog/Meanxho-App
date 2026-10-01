import Link from "next/link";
import { ForgotForm } from "@/components/auth-forms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function ForgotPasswordPage() {
  const locale = await readLocale();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "forgotTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t(locale, "forgotBody")}</p>
      </div>
      <ForgotForm locale={locale} />
      <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
        {t(locale, "back")}
      </Link>
    </section>
  );
}
