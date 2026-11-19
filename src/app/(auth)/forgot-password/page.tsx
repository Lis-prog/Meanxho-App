import { BackButton } from "@/components/back-button";
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
      <BackButton href="/login" label={t(locale, "back")} />
    </section>
  );
}
