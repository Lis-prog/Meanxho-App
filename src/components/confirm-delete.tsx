"use client";

import { t, type Locale } from "@/lib/i18n";

export function ConfirmDelete({
  locale,
  action,
  id,
  messageKey,
}: {
  locale: Locale;
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  messageKey: "deleteConfirm" | "deleteIncomeConfirm";
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t(locale, messageKey))) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-danger underline-offset-4 hover:underline">
        {t(locale, "delete")}
      </button>
    </form>
  );
}
