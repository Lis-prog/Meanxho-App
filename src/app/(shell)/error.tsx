"use client";

import { t } from "@/lib/i18n";
import { primaryButtonClass } from "@/lib/styles";

export default function ShellError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const english = typeof document !== "undefined" && document.documentElement.lang === "en";
  const locale = english ? "en" : "sq";

  return (
    <div className="rounded-[28px] border border-line bg-surface p-8">
      <h1 className="font-serif text-3xl">{t(locale, "somethingWrong")}</h1>
      <button className={`${primaryButtonClass} mt-6`} onClick={() => reset()} type="button">
        {t(locale, "tryAgain")}
      </button>
    </div>
  );
}
