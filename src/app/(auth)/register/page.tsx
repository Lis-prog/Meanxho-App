import { AuthLinks, RegisterForm } from "@/components/auth-forms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function RegisterPage() {
  const locale = await readLocale();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "registerTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t(locale, "localPrivacy")}</p>
      </div>
      <RegisterForm locale={locale} />
      <AuthLinks locale={locale} mode="register" />
    </section>
  );
}
