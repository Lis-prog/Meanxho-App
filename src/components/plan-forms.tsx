"use client";

import { useActionState, useEffect, useState } from "react";
import { ConfirmDialog, useConfirmGate } from "@/components/confirm-dialog";
import {
  BILL_KINDS,
  GROUP_KEYS,
  OBLIGATION_CADENCES,
  type AmountMode,
  type BillKind,
  type ObligationCadence,
} from "@/lib/categories";
import { groupLabel, obligationKindLabel, t, translateError, type Locale, weekdayLabel } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/sq";
import { inputClass, labelClass, primaryButtonClass, quietButtonClass } from "@/lib/styles";
import {
  addGoalContributionAction,
  createGoalAction,
  createLoanAction,
  createObligationAction,
  markObligationPaidAction,
  updateObligationPlanAction,
  updateSavingsTargetAction,
  upsertBudgetAction,
  withdrawGoalContributionAction,
} from "@/server/plan";

type CategoryChoice = { id: string; name: string; groupKey: string; key?: string };

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
  titleKey = "confirmAddTitle",
  bodyKey,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  open: boolean;
  titleKey?: MessageKey;
  bodyKey: MessageKey;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={t(locale, titleKey)}
      body={t(locale, bodyKey)}
      confirmLabel={t(locale, "yes")}
      cancelLabel={t(locale, "no")}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

export function ObligationForm({
  locale,
  categories,
  today,
}: {
  locale: Locale;
  categories: CategoryChoice[];
  today: string;
}) {
  const [state, action, pending] = useActionState(createObligationAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();
  const [kind, setKind] = useState<BillKind | "">("");
  const [cadence, setCadence] = useState<ObligationCadence>("monthly");
  const [amountMode, setAmountMode] = useState<AmountMode>("fixed");

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  function onKindChange(next: BillKind) {
    setKind(next);
    if (next === "utility") setAmountMode("variable");
    else setAmountMode("fixed");
  }

  const derivedMode: AmountMode = kind === "utility" ? "variable" : kind === "other" ? amountMode : "fixed";
  const hints: Record<BillKind, MessageKey> = {
    rent: "billKindRentHint",
    utility: "billKindUtilityHint",
    subscription: "billKindSubHint",
    other: "billKindOtherHint",
  };

  return (
    <>
    <form ref={formRef} action={action} className="space-y-4" onSubmit={onSubmit}>
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "billName")}</span>
        <input className={inputClass} name="name" maxLength={80} required />
      </label>
      <fieldset className="space-y-2">
        <legend className={labelClass}>{t(locale, "billKind")}</legend>
        {BILL_KINDS.map((item, index) => (
          <label
            key={item}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${
              kind === item ? "border-pine bg-pine-soft" : "border-line bg-white"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={item}
              required={index === 0}
              checked={kind === item}
              onChange={() => onKindChange(item)}
              className="mt-1 size-4 accent-pine"
            />
            <span>
              <span className="block font-semibold">{obligationKindLabel(locale, item)}</span>
              <span className="mt-0.5 block text-sm text-muted">{t(locale, hints[item])}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {kind === "other" ? (
        <>
          <fieldset className="space-y-2">
            <legend className={labelClass}>{t(locale, "amountMode")}</legend>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${
                amountMode === "fixed" ? "border-pine bg-pine-soft" : "border-line bg-white"
              }`}
            >
              <input
                type="radio"
                name="amountMode"
                value="fixed"
                checked={amountMode === "fixed"}
                onChange={() => setAmountMode("fixed")}
                className="mt-1 size-4 accent-pine"
              />
              <span>
                <span className="block font-semibold">{t(locale, "amountFixed")}</span>
                <span className="mt-0.5 block text-sm text-muted">{t(locale, "amountFixedHint")}</span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 ${
                amountMode === "variable" ? "border-pine bg-pine-soft" : "border-line bg-white"
              }`}
            >
              <input
                type="radio"
                name="amountMode"
                value="variable"
                checked={amountMode === "variable"}
                onChange={() => setAmountMode("variable")}
                className="mt-1 size-4 accent-pine"
              />
              <span>
                <span className="block font-semibold">{t(locale, "amountVariable")}</span>
                <span className="mt-0.5 block text-sm text-muted">{t(locale, "amountVariableHint")}</span>
              </span>
            </label>
          </fieldset>
          <label className="block">
            <span className={labelClass}>{t(locale, "categoryIfOther")}</span>
            <select className={inputClass} name="categoryId" required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <input type="hidden" name="amountMode" value={derivedMode} />
      )}
      <label className="block">
        <span className={labelClass}>{t(locale, derivedMode === "variable" ? "amountTypical" : "amount")}</span>
        <input className={inputClass} name="amount" inputMode="decimal" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "cadence")}</span>
        <select
          className={inputClass}
          name="cadence"
          value={cadence}
          onChange={(event) => setCadence(event.target.value as ObligationCadence)}
        >
          {OBLIGATION_CADENCES.map((item) => (
            <option key={item} value={item}>
              {t(locale, item as "monthly" | "weekly" | "yearly")}
            </option>
          ))}
        </select>
      </label>
      {cadence === "weekly" ? (
        <label className="block">
          <span className={labelClass}>{t(locale, "weekday")}</span>
          <select className={inputClass} name="weekday" defaultValue="1">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <option key={day} value={day}>
                {weekdayLabel(locale, day)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block">
          <span className={labelClass}>{t(locale, "dueDay")}</span>
          <input className={inputClass} name="dueDay" inputMode="numeric" defaultValue="1" />
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t(locale, "startOn")}</span>
          <input className={inputClass} type="date" name="startOn" defaultValue={today} required />
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "endOn")}</span>
          <input className={inputClass} type="date" name="endOn" />
        </label>
      </div>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "addObligation")}
      </button>
    </form>
    <AddConfirm locale={locale} open={open} bodyKey="confirmAddObligation" onConfirm={confirm} onCancel={cancel} />
    </>
  );
}

export function MarkPaidForm({
  locale,
  id,
  periodKey,
  variable,
  amount,
}: {
  locale: Locale;
  id: string;
  periodKey: string;
  variable: boolean;
  amount: string;
}) {
  const [state, action, pending] = useActionState(markObligationPaidAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
      <form ref={formRef} action={action} className="flex flex-wrap items-end gap-2" onSubmit={onSubmit}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="periodKey" value={periodKey} />
        {variable ? (
          <label className="block min-w-[8rem] flex-1">
            <span className="mb-1 block text-sm font-medium">{t(locale, "amountThisTime")}</span>
            <input className={inputClass} name="amount" inputMode="decimal" defaultValue={amount} required />
          </label>
        ) : null}
        <button className={primaryButtonClass} disabled={pending}>
          {pending ? t(locale, "saving") : t(locale, "markPaid")}
        </button>
        {state.error ? (
          <p role="alert" className="w-full text-sm text-danger">
            {translateError(locale, state.error)}
          </p>
        ) : null}
      </form>
      <ConfirmDialog
        open={open}
        title={t(locale, "confirmPayTitle")}
        body={t(locale, "confirmPayBill")}
        confirmLabel={t(locale, "yes")}
        cancelLabel={t(locale, "no")}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}

export function UpdateBillForm({
  locale,
  id,
  amount,
  amountMode,
}: {
  locale: Locale;
  id: string;
  amount: string;
  amountMode: AmountMode;
}) {
  const [state, action, pending] = useActionState(updateObligationPlanAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
      <form ref={formRef} action={action} className="mt-4 space-y-3 rounded-2xl bg-paper p-3" onSubmit={onSubmit}>
        <input type="hidden" name="id" value={id} />
        <Alert locale={locale} error={state.error} />
        <label className="block">
          <span className={labelClass}>{t(locale, "updateBillAmount")}</span>
          <input className={inputClass} name="amount" inputMode="decimal" defaultValue={amount} required />
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "amountMode")}</span>
          <select className={inputClass} name="amountMode" defaultValue={amountMode}>
            <option value="fixed">{t(locale, "amountFixed")}</option>
            <option value="variable">{t(locale, "amountVariable")}</option>
          </select>
        </label>
        <button className={quietButtonClass} disabled={pending}>
          {pending ? t(locale, "saving") : t(locale, "saveChanges")}
        </button>
      </form>
      <AddConfirm locale={locale} open={open} titleKey="confirmSaveChanges" bodyKey="confirmSaveChanges" onConfirm={confirm} onCancel={cancel} />
    </>
  );
}

export function LoanForm({ locale, today }: { locale: Locale; today: string }) {
  const [state, action, pending] = useActionState(createLoanAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
    <form ref={formRef} action={action} className="space-y-4" onSubmit={onSubmit}>
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "loanName")}</span>
        <input className={inputClass} name="name" maxLength={80} required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "originalAmount")}</span>
        <input className={inputClass} name="original" inputMode="decimal" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "remainingBalance")}</span>
        <input className={inputClass} name="remaining" inputMode="decimal" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "monthlyPayment")}</span>
        <input className={inputClass} name="payment" inputMode="decimal" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "dueDay")}</span>
        <input className={inputClass} name="paymentDay" inputMode="numeric" defaultValue="15" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "interestOptional")}</span>
        <input className={inputClass} name="interest" inputMode="decimal" placeholder="0" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t(locale, "startOn")}</span>
          <input className={inputClass} type="date" name="startOn" defaultValue={today} required />
        </label>
        <label className="block">
          <span className={labelClass}>{t(locale, "endOn")}</span>
          <input className={inputClass} type="date" name="endOn" />
        </label>
      </div>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "addLoan")}
      </button>
    </form>
    <AddConfirm locale={locale} open={open} bodyKey="confirmAddLoan" onConfirm={confirm} onCancel={cancel} />
    </>
  );
}

export function SavingsTargetForm({ locale, current }: { locale: Locale; current: string }) {
  const [state, action, pending] = useActionState(updateSavingsTargetAction, {});

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "savingsTarget")}</span>
        <input className={inputClass} name="savings" inputMode="decimal" defaultValue={current} />
      </label>
      <button className={primaryButtonClass} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "saveTarget")}
      </button>
    </form>
  );
}

export function GoalForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(createGoalAction, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  return (
    <>
    <form ref={formRef} action={action} className="space-y-4" onSubmit={onSubmit}>
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "goalName")}</span>
        <input className={inputClass} name="name" maxLength={80} required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "goalTarget")}</span>
        <input className={inputClass} name="target" inputMode="decimal" required />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "goalCurrent")}</span>
        <input className={inputClass} name="current" inputMode="decimal" />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "goalMonthly")}</span>
        <input className={inputClass} name="monthly" inputMode="decimal" />
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "deadlineOptional")}</span>
        <input className={inputClass} type="date" name="deadline" />
      </label>
      <button className={`${primaryButtonClass} w-full`} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "addGoal")}
      </button>
    </form>
    <AddConfirm locale={locale} open={open} bodyKey="confirmAddGoal" onConfirm={confirm} onCancel={cancel} />
    </>
  );
}

function GoalAmountForm({
  locale,
  id,
  mode,
  disabled,
}: {
  locale: Locale;
  id: string;
  mode: "add" | "withdraw";
  disabled?: boolean;
}) {
  const actionFn = mode === "add" ? addGoalContributionAction : withdrawGoalContributionAction;
  const [state, action, pending] = useActionState(actionFn, {});
  const { formRef, open, onSubmit, confirm, cancel, reset } = useConfirmGate();

  useEffect(() => {
    if (state.error) reset();
  }, [state.error, reset]);

  const blocked = Boolean(disabled) || pending;

  return (
    <>
      <form ref={formRef} action={action} className="space-y-2" onSubmit={onSubmit}>
        <Alert locale={locale} error={state.error} />
        <input type="hidden" name="id" value={id} />
        <label className="block">
          <span className="sr-only">{t(locale, "amount")}</span>
          <input
            className={inputClass}
            name="amount"
            inputMode="decimal"
            required
            disabled={blocked}
            aria-label={t(locale, "amount")}
          />
        </label>
        <button
          className={`${mode === "withdraw" ? quietButtonClass : primaryButtonClass} w-full`}
          disabled={blocked}
        >
          {pending
            ? t(locale, "saving")
            : t(locale, mode === "add" ? "addContribution" : "withdrawFromGoal")}
        </button>
      </form>
      <AddConfirm
        locale={locale}
        open={open}
        titleKey={mode === "add" ? "confirmAddTitle" : "confirmWithdrawTitle"}
        bodyKey={mode === "add" ? "confirmAddContribution" : "confirmWithdraw"}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}

export function ContributionForm({ locale, id }: { locale: Locale; id: string }) {
  return <GoalAmountForm locale={locale} id={id} mode="add" />;
}

export function WithdrawForm({
  locale,
  id,
  currentMinor,
}: {
  locale: Locale;
  id: string;
  currentMinor: number;
}) {
  return <GoalAmountForm locale={locale} id={id} mode="withdraw" disabled={currentMinor <= 0} />;
}

export function BudgetForm({ locale, categories }: { locale: Locale; categories: CategoryChoice[] }) {
  const [state, action, pending] = useActionState(upsertBudgetAction, {});
  const groups = GROUP_KEYS.map((key) => ({
    key,
    label: groupLabel(locale, key),
    items: categories.filter((category) => category.groupKey === key),
  })).filter((group) => group.items.length > 0);

  return (
    <form action={action} className="space-y-4">
      <Alert locale={locale} error={state.error} />
      <label className="block">
        <span className={labelClass}>{t(locale, "category")}</span>
        <select className={inputClass} name="categoryId" required>
          {groups.flatMap((group) =>
            group.items.map((category) => (
              <option key={category.id} value={category.id}>
                {group.label} · {category.name}
              </option>
            )),
          )}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>{t(locale, "budgetLimit")}</span>
        <input className={inputClass} name="limit" inputMode="decimal" required />
      </label>
      <button className={primaryButtonClass} disabled={pending}>
        {pending ? t(locale, "saving") : t(locale, "saveBudget")}
      </button>
    </form>
  );
}

export function ScenarioForm({ locale }: { locale: Locale }) {
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_auto]" action="/reports" method="get">
      <label className="block">
        <span className={labelClass}>{t(locale, "scenarioLess")}</span>
        <input className={inputClass} name="less" inputMode="decimal" placeholder="50" />
      </label>
      <button className={`${primaryButtonClass} self-end`} type="submit">
        {t(locale, "apply")}
      </button>
    </form>
  );
}
