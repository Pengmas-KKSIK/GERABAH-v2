"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Perilaku dasar jendela modal: Escape menutup, Tab tidak keluar dari jendela,
 * halaman di belakang tidak ikut tergulir, dan fokus kembali ke tombol pembuka saat ditutup.
 */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const el = ref.current;
    (initialFocus?.current ?? el?.querySelector<HTMLElement>(FOCUSABLE) ?? el)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export type ConfirmSpec = {
  /** Pertanyaan spesifik, mis. "Hapus catatan ini?" */
  title: string;
  /** Satu kalimat akibatnya. */
  body?: string;
  /** Label tombol aksi, mis. "Hapus". */
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
};

/** Pengganti window.confirm: teks dalam bahasa aplikasi, tombol berlabel aksinya. */
export function ConfirmDialog({
  spec,
  onConfirm,
  onCancel,
}: {
  spec: ConfirmSpec;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Aksi merusak: fokus awal di "Batal" supaya Enter tidak langsung menghapus.
  useModal(ref, onCancel, spec.danger ? cancelRef : undefined);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-fade absolute inset-0 bg-ink/40" onClick={onCancel} aria-hidden />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={spec.body ? "confirm-body" : undefined}
        className="animate-pop relative w-full max-w-sm rounded-t-[var(--radius-xl)] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop sm:rounded-[var(--radius-xl)] sm:pb-5"
      >
        <h2 id="confirm-title" className="text-[18px] font-semibold leading-snug text-ink">
          {spec.title}
        </h2>
        {spec.body && (
          <p id="confirm-body" className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
            {spec.body}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn btn-secondary">
            {spec.cancelLabel ?? "Batal"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn ${spec.danger ? "btn-danger-solid" : "btn-primary"}`}
          >
            {spec.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Jendela lembar dari bawah (HP) / tengah (desktop) dengan judul. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useModal(ref, onClose);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-fade absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="animate-pop relative w-full max-w-md rounded-t-[var(--radius-xl)] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop sm:rounded-[var(--radius-xl)] sm:pb-5"
      >
        <div className="mx-auto -mt-1 mb-4 h-1 w-9 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <h2 id="sheet-title" className="mb-3 text-[18px] font-semibold text-ink">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
