"use client";

import { ConfirmDialog, useConfirmGate } from "@/components/confirm-dialog";
import { t, type Locale } from "@/lib/i18n";
import { dangerButtonClass } from "@/lib/styles";

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 6h11M8 6V4.8A1.3 1.3 0 0 1 9.3 3.5h1.4A1.3 1.3 0 0 1 12 4.8V6m2.2 0v9.2A1.8 1.8 0 0 1 12.4 17H7.6a1.8 1.8 0 0 1-1.8-1.8V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 9v5M11.5 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ConfirmDelete({
  locale,
  action,
  id,
  messageKey,
}: {
  locale: Locale;
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  messageKey:
    | "deleteConfirm"
    | "deleteIncomeConfirm"
    | "deleteObligationConfirm"
    | "deleteLoanConfirm"
    | "deleteGoalConfirm"
    | "deleteBudgetConfirm";
}) {
  const { formRef, open, onSubmit, confirm, cancel } = useConfirmGate();

  return (
    <>
      <form ref={formRef} action={action} onSubmit={onSubmit} className="inline-flex">
        <input type="hidden" name="id" value={id} />
        <button type="submit" className={dangerButtonClass}>
          <TrashIcon />
          {t(locale, "delete")}
        </button>
      </form>
      <ConfirmDialog
        open={open}
        title={t(locale, "confirmDeleteTitle")}
        body={t(locale, messageKey)}
        confirmLabel={t(locale, "yes")}
        cancelLabel={t(locale, "no")}
        danger
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}
