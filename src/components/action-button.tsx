"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { FormState } from "@/lib/action-state";
import { ConfirmDialog, type ConfirmSpec } from "./dialog";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function Inner({
  children,
  className,
  pendingLabel,
  confirm,
  ariaLabel,
}: {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
  confirm?: ConfirmSpec;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  const [asking, setAsking] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={ref}
        type="submit"
        disabled={pending}
        className={className}
        aria-busy={pending}
        aria-label={ariaLabel}
        onClick={(e) => {
          if (confirm) {
            e.preventDefault();
            setAsking(true);
          }
        }}
      >
        {pending ? pendingLabel ?? "…" : children}
      </button>
      {asking && confirm && (
        <ConfirmDialog
          spec={confirm}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            const btn = ref.current;
            btn?.form?.requestSubmit(btn);
          }}
        />
      )}
    </>
  );
}

/** Satu tombol yang menjalankan server action. Galat tampil di bawah tombol. */
export function ActionButton({
  action,
  hidden,
  children,
  className = "btn btn-secondary",
  pendingLabel,
  confirm,
  ariaLabel,
}: {
  action: Action;
  hidden?: Record<string, string>;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  /** Kalau diisi, tampilkan dialog konfirmasi sebelum aksi dijalankan. */
  confirm?: ConfirmSpec;
  ariaLabel?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="contents">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Inner className={className} pendingLabel={pendingLabel} confirm={confirm} ariaLabel={ariaLabel}>
        {children}
      </Inner>
      {state.error && (
        <p role="alert" className="col-span-full mt-1 text-[14px] font-medium text-bad">
          {state.error}
        </p>
      )}
    </form>
  );
}
