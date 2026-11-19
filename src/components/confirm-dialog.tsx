"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { dangerButtonClass, primaryButtonClass, quietButtonClass } from "@/lib/styles";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[28px] border border-line bg-surface p-6 shadow-[var(--shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-serif text-2xl tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-muted">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className={quietButtonClass} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={danger ? dangerButtonClass : primaryButtonClass}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmGate() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const onSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    if (formRef.current?.dataset.confirmed === "1") return;
    event.preventDefault();
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    setOpen(true);
  }, []);

  const confirm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.dataset.confirmed = "1";
    setOpen(false);
    formRef.current.requestSubmit();
  }, []);

  const cancel = useCallback(() => {
    if (formRef.current) formRef.current.dataset.confirmed = "";
    setOpen(false);
  }, []);

  const reset = useCallback(() => {
    if (formRef.current) formRef.current.dataset.confirmed = "";
  }, []);

  return { formRef, open, onSubmit, confirm, cancel, reset };
}
