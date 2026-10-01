import Link from "next/link";
import { LocaleSwitch, Wordmark } from "@/components/brand";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await readLocale();

  return (
    <main id="content" className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
        <LocaleSwitch locale={locale} />
      </header>
      {children}
      <p className="mt-8 text-sm leading-6 text-muted">{t(locale, "landingFoot")}</p>
    </main>
  );
}
