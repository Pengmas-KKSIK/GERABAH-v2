import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "./logo";

/**
 * Kerangka halaman masuk / daftar / lupa sandi.
 * HP: foto di atas, formulir di bawah. Desktop: foto di kiri, formulir di kanan.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  image = "/images/wheel.webp",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  image?: string;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative h-44 overflow-hidden bg-ink sm:h-56 lg:sticky lg:top-0 lg:h-dvh">
        <Image src={image} alt="" fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" />
        <div className="cover-shade absolute inset-0" />
        <p className="absolute bottom-10 left-10 right-10 hidden max-w-md text-[20px] font-medium leading-snug text-white/90 lg:block">
          Catatan keuangan usaha gerabah — sesederhana menulis di buku.
        </p>
      </div>

      <div className="relative -mt-5 rounded-t-[var(--radius-xl)] bg-canvas lg:mt-0 lg:flex lg:items-center lg:rounded-none">
        <div className="page-enter mx-auto w-full max-w-sm px-5 pb-12 pt-8 lg:py-16">
          <Logo size={40} className="mb-5" />
          <h1 className="text-[28px] font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <p className="mt-6 text-center text-[15px] text-ink-2">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
