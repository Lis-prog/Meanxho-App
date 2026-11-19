import { setLocaleAction } from "@/server/auth";
import type { Locale } from "@/lib/i18n";

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 font-serif text-xl tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-pine text-sm text-white">M</span>
      Menaxho
    </span>
  );
}

export function LocaleSwitch({ locale }: { locale: Locale }) {
  return (
    <form action={setLocaleAction} className="inline-flex rounded-full border border-line bg-surface p-1 text-sm">
      <button
        type="submit"
        name="locale"
        value="sq"
        aria-pressed={locale === "sq"}
        className={`rounded-full px-3 py-1.5 transition ${locale === "sq" ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"}`}
      >
        Shqip
      </button>
      <button
        type="submit"
        name="locale"
        value="en"
        aria-pressed={locale === "en"}
        className={`rounded-full px-3 py-1.5 transition ${locale === "en" ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"}`}
      >
        English
      </button>
    </form>
  );
}
