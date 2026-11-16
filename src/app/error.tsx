"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/logo";

/** Halaman cadangan kalau sebuah halaman gagal dimuat (mis. koneksi database terputus sebentar). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo size={40} className="mb-2" />
      <h1 className="text-[24px] font-bold text-ink">Halaman gagal dimuat</h1>
      <p className="text-[15px] leading-relaxed text-ink-2">
        Biasanya karena koneksi internet atau server sedang sibuk. Data kamu aman — coba muat ulang.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2.5">
        <button type="button" onClick={reset} className="btn btn-primary w-full">
          Coba Lagi
        </button>
        <Link href="/dashboard" className="btn btn-secondary w-full">
          Ke Beranda
        </Link>
      </div>
      {error.digest && <p className="mt-2 text-[13px] text-ink-3">Kode: {error.digest}</p>}
    </main>
  );
}
