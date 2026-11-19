"use client";

import { useActionState, useEffect } from "react";
import { ConfirmDialog, useConfirmGate } from "@/components/confirm-dialog";
import { GROUP_KEYS, INCOME_KINDS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/categories";
import { groupLabel, t, translateError, type Locale } from "@/lib/i18n";
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass } from "@/lib/styles";
import { createCategoryAction, createExpenseAction, createIncomeAction, deleteAccountAction, updateExpenseAction, updateProfileAction } from "@/server/finance";
import { CURRENCIES, TIMEZONES } from "@/lib/categories";
import { timezoneLabel } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/sq";

export type CategoryChoice = {
  id: string;
  name: string;
  groupKey: string;
};

function Alert({ locale, error }: { locale: Locale; error?: string }) {
  const message = translateError(locale, error);
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

function AddConfirm({
  locale,
  open,
  bodyKey,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  open: boolean;
  bodyKey: MessageKey;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={t(locale, "confirmAddTitle")}
      body={t(locale, bodyKey)}
      confirmLabel={t(locale, "yes")}
      cancelLabel={t(locale, "no")}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export function ExpenseForm({
  locale,
  categories,
  defaults,
  mode,
  today,
}: {
  locale: Locale;
  categories: CategoryChoice[];
  defaults: {
    id?: string;
    amount: string;
    categoryId: string;
    note: string;
    spentOn: string;
    paymentMethod: PaymentMethod;
  };
  mode: "create" | "edit";
  today: string;
}) {
  const action = mode === "create" ? createExpenseAction : updateExpenseAction;
  const [state, formAction, pending] = useActionState(action, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();
  const groups = GROUP_KEYS.map((key) => ({
    key,
    label: groupLabel(locale, key),
    items: categories.filter((category) => category.groupKey === key),
  })).filter((group) => group.items.length > 0);

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-6" onSubmit={onSubmit}>
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "amount")}</span>
        <input
          className={`${inputClass} font-serif text-4xl`}
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          defaultValue={defaults.amount}
          autoFocus={mode === "create"}
          required
        />
      </label>

      <fieldset>
        <legend className={`${labelClass} mb-3`}>{t(locale, "category")}</legend>
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">{group.label}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.items.map((category) => (
                  <label
                    key={category.id}
                    className="cursor-pointer rounded-2xl border border-line bg-paper px-3 py-3 text-center text-sm has-[:checked]:border-pine has-[:checked]:bg-pine-soft has-[:checked]:font-semibold has-[:checked]:text-pine-deep"
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="categoryId"
                      value={category.id}
                      defaultChecked={category.id === defaults.categoryId}
                      required
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t(locale, "date")}</span>
          <input className={inputClass} type="date" name="spentOn" defaultValue={defaults.spentOn} max={today} required />
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "payment")}</span>
          <select className={inputClass} name="paymentMethod" defaultValue={defaults.paymentMethod}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {t(locale, method === "cash" ? "payCash" : method === "card" ? "payCard" : method === "transfer" ? "payTransfer" : method === "credit" ? "payCredit" : "payOther")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>{t(locale, "note")}</span>
        <input
          className={inputClass}
          name="note"
          maxLength={160}
          placeholder={t(locale, "notePlaceholder")}
          defaultValue={defaults.note}
        />
      </label>

      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, mode === "create" ? "saveExpense" : "saveChanges")}
      </button>
    </form>
      <AddConfirm
        locale={locale}
        open={open}
        bodyKey={mode === "create" ? "confirmAddExpense" : "confirmSaveChanges"}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}

export function IncomeForm({
  locale,
  today,
}: {
  locale: Locale;
  today: string;
}) {
  const [state, action, pending] = useActionState(createIncomeAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
      <form ref={formRef} action={action} className="space-y-4" onSubmit={onSubmit}>
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "amount")}</span>
        <input className={`${inputClass} font-serif text-3xl`} name="amount" inputMode="decimal" placeholder="1200" required autoFocus />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t(locale, "kind")}</span>
          <select className={inputClass} name="kind" defaultValue="salary">
            {INCOME_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(locale, kind === "salary" ? "kindSalary" : kind === "freelance" ? "kindFreelance" : kind === "bonus" ? "kindBonus" : "kindOther")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "cadence")}</span>
          <select className={inputClass} name="cadence" defaultValue="monthly">
            <option value="monthly">{t(locale, "monthly")}</option>
            <option value="once">{t(locale, "once")}</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>{t(locale, "date")}</span>
        <input className={inputClass} type="date" name="receivedOn" defaultValue={today} max={today} />
        <span className="mt-2 block text-sm text-muted">{t(locale, "incomeBody")}</span>
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "labelOptional")}</span>
        <input className={inputClass} name="label" maxLength={80} />
      </label>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "addIncome")}
      </button>
    </form>
      <AddConfirm locale={locale} open={open} bodyKey="confirmAddIncome" onConfirm={confirm} onCancel={cancel} />
    </>
  );
}

export function ProfileForm({
  locale,
  name,
  currency,
  timezone,
  currencyLocked,
}: {
  locale: Locale;
  name: string;
  currency: string;
  timezone: string;
  currencyLocked: boolean;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, {});

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "name")}</span>
        <input className={inputClass} name="name" defaultValue={name} required maxLength={80} />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "language")}</span>
        <select className={inputClass} name="locale" defaultValue={locale}>
          <option value="sq">{t(locale, "albanian")}</option>
          <option value="en">{t(locale, "english")}</option>
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "currency")}</span>
        <select className={inputClass} name="currency" defaultValue={currency} disabled={currencyLocked}>
          {CURRENCIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {currencyLocked ? <input type="hidden" name="currency" value={currency} /> : null}
        {currencyLocked ? <span className="mt-2 block text-sm text-muted">{t(locale, "currencyLocked")}</span> : null}
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "timezone")}</span>
        <select className={inputClass} name="timezone" defaultValue={timezone}>
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {timezoneLabel(locale, zone)}
            </option>
          ))}
        </select>
      </label>
      <button className={primaryButtonClass} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "saveProfile")}
      </button>
    </form>
  );
}

export function CategoryForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(createCategoryAction, {});

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "categoryName")}</span>
        <input className={inputClass} name="name" maxLength={40} required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "group")}</span>
        <select className={inputClass} name="groupKey" defaultValue="other">
          {GROUP_KEYS.map((key) => (
            <option key={key} value={key}>
              {groupLabel(locale, key)}
            </option>
          ))}
        </select>
      </label>
      <button className={primaryButtonClass} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "addCategory")}
      </button>
    </form>
  );
}

export function DeleteAccountForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(deleteAccountAction, {});

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "confirmEmail")}</span>
        <input className={inputClass} name="confirmEmail" type="email" autoComplete="off" required />
      </label>
      <button className={dangerButtonClass} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "deleteAccount")}
      </button>
    </form>
  );
}
