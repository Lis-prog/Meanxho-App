import Link from "next/link";
import { ResetForm } from "@/components/auth-forms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await readLocale();
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <section className="space-y-6">
      <h1 className="font-serif text-4xl tracking-tight">{t(locale, "resetTitle")}</h1>
      {token.length < 32 ? (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {t(locale, "errorReset")}
        </p>
      ) : (
        <ResetForm locale={locale} token={token} />
      )}
      <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
        {t(locale, "back")}
      </Link>
    </section>
  );
}
