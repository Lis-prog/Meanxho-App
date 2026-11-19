import Link from "next/link";
import { redirect } from "next/navigation";
import { LocaleSwitch, Wordmark } from "@/components/brand";
import { Money } from "@/components/money";
import { getCurrentUser } from "@/lib/current-user";
import { t, type Locale } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";
import { primaryButtonClass, quietButtonClass } from "@/lib/styles";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardingCompletedAt ? "/dashboard" : "/onboarding");
  const locale = await readLocale();

  return (
    <main id="content" className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-5 py-5 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <Wordmark />
        <div className="flex items-center gap-3">
          <LocaleSwitch locale={locale} />
          <Link href="/login" className="hidden text-sm font-medium sm:inline">
            {t(locale, "landingLogin")}
          </Link>
        </div>
      </header>

      <section className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-pine uppercase">{t(locale, "landingKicker")}</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            {t(locale, "landingTitle")}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">{t(locale, "landingBody")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={primaryButtonClass}>
              {t(locale, "landingStart")}
            </Link>
            <Link href="/login" className={quietButtonClass}>
              {t(locale, "landingLogin")}
            </Link>
          </div>
          <p className="mt-6 max-w-md text-sm text-muted">{t(locale, "localPrivacy")}</p>
        </div>
        <ExampleCard locale={locale} />
      </section>

      <footer className="mt-auto pb-6 text-sm text-muted">{t(locale, "landingFoot")}</footer>
    </main>
  );
}

function ExampleCard({ locale }: { locale: Locale }) {
  return (
    <aside className="rounded-[28px] border border-line bg-surface p-6 shadow-[var(--shadow)] sm:p-8" aria-label={t(locale, "landingExample")}>
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">{t(locale, "landingExample")}</p>
      <p className="mt-6 text-sm text-muted">{t(locale, "landingRemaining")}</p>
      <p className="mt-2 font-serif text-6xl tracking-tight">
        <Money amountMinor={74200} currency="EUR" locale={locale} />
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-paper px-4 py-3">
          <p className="text-xs text-muted">{t(locale, "landingSpent")}</p>
          <p className="mt-1 font-serif text-2xl">
            <Money amountMinor={45800} currency="EUR" locale={locale} />
          </p>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-3">
          <p className="text-xs text-muted">{t(locale, "landingToday")}</p>
          <p className="mt-1 font-serif text-2xl">
            <Money amountMinor={650} currency="EUR" locale={locale} />
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Bar label={t(locale, "groupFood")} width="62%" />
        <Bar label={t(locale, "groupTransport")} width="28%" />
        <Bar label={t(locale, "catRent")} width="84%" />
      </div>
    </aside>
  );
}

function Bar({ label, width }: { label: string; width: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-pine" style={{ width }} />
      </div>
    </div>
  );
}
