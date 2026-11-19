"use client";

import { useActionState, useEffect } from "react";
import { ConfirmDialog, useConfirmGate } from "@/components/confirm-dialog";
import { completeOnboardingAction, skipOnboardingAction } from "@/server/plan";
import { t, translateError, type Locale } from "@/lib/i18n";
import { inputClass, labelClass, primaryButtonClass, quietButtonClass } from "@/lib/styles";

export function OnboardingForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();
  const error = translateError(locale, state.error);

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
      <form ref={formRef} action={action} className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Field name="income" label={t(locale, "onboardIncome")} />
        <Field name="rent" label={t(locale, "onboardRent")} />
        <Field name="loanPayment" label={t(locale, "onboardLoan")} />
        <Field name="loanRemaining" label={t(locale, "onboardLoanLeft")} />
        <Field name="subscription" label={t(locale, "onboardSub")} />
        <Field name="savings" label={t(locale, "onboardSave")} />
        <button className={`${primaryButtonClass} w-full`} disabled={pending}>
          {pending ? t(locale, "saving") : t(locale, "onboardFinish")}
        </button>
      </form>
      <ConfirmDialog
        open={open}
        title={t(locale, "confirmAddTitle")}
        body={t(locale, "confirmAddOnboarding")}
        confirmLabel={t(locale, "yes")}
        cancelLabel={t(locale, "no")}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} name={name} inputMode="decimal" placeholder="0" />
    </label>
  );
}

export function SkipOnboarding({ locale }: { locale: Locale }) {
  return (
    <form action={skipOnboardingAction}>
      <button className={`${quietButtonClass} w-full`} type="submit">
        {t(locale, "onboardSkip")}
      </button>
    </form>
  );
}
