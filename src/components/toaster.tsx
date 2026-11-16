"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IconCheck } from "./icons";

const COOKIE = "gerabah_flash"; // sama dengan FLASH_COOKIE di lib/flash.ts

function takeFlash(): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  if (!hit) return null;
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
  try {
    return decodeURIComponent(hit.slice(COOKIE.length + 1)) || null;
  } catch {
    return null;
  }
}

/** Notifikasi kecil "Tersimpan ✓" di bawah layar, hilang sendiri setelah 2,8 detik. */
export function Toaster() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  // Cek pesan setiap kali pindah halaman (Server Action yang redirect menaruh pesannya di cookie).
  useEffect(() => {
    const t = setTimeout(() => {
      const text = takeFlash();
      if (text) setToast({ id: Date.now(), text });
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, search]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="toast pointer-events-none fixed inset-x-0 bottom-[calc(100px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 sm:bottom-8"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-3 pr-5 text-[14px] font-medium text-white shadow-pop">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-good text-white">
          <IconCheck className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        {toast.text}
      </div>
    </div>
  );
}
