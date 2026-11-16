import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center px-5 text-center">
      <Logo size={40} className="mb-5" />
      <p className="tnum text-[15px] font-semibold text-ink-3">404</p>
      <h1 className="mt-2 text-[24px] font-bold text-ink">Halaman tidak ditemukan</h1>
      <p className="mt-1.5 text-[15px] text-ink-2">Mungkin sudah dihapus, atau alamatnya keliru.</p>
      <Link href="/dashboard" className="btn btn-primary mt-6">
        Ke Beranda
      </Link>
    </main>
  );
}
