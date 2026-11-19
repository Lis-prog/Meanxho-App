import { redirect } from "next/navigation";
import { OnboardingForm, SkipOnboarding } from "@/components/onboarding-form";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale, t, type Locale } from "@/lib/i18n";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  const locale: Locale = user.locale;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl tracking-tight">{t(locale, "onboardTitle")}</h1>
        <p className="mt-3 text-muted">{t(locale, "onboardBody")}</p>
      </div>
      <div className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
        <OnboardingForm locale={locale} />
      </div>
      <SkipOnboarding locale={locale} />
    </section>
  );
}
