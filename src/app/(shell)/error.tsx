"use client";

import { t } from "@/lib/i18n";

export default function ShellError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const english = typeof document !== "undefined" && document.documentElement.lang === "en";
  const locale = english ? "en" : "sq";

  return (
    <div className="rounded-[28px] border border-line bg-surface p-8">
      <h1 className="font-serif text-3xl">{t(locale, "somethingWrong")}</h1>
      <button className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white" onClick={() => reset()} type="button">
        {t(locale, "tryAgain")}
      </button>
    </div>
  );
}
