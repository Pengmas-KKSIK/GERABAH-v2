import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronLeft } from "./icons";

/**
 * Satu-satunya header halaman. Semua halaman memakai ini supaya ukuran judul, jarak, dan
 * letak tombol aksi sama di mana pun.
 *
 * `backMobileOnly` dipakai untuk halaman yang di desktop sudah dicapai lewat sidebar
 * (mis. Pengaturan): tautan "Kembali" ke halaman Menu hanya masuk akal di HP.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  back,
  backLabel = "Kembali",
  backMobileOnly = false,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  back?: string;
  backLabel?: string;
  backMobileOnly?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link
          href={back}
          className={`-ml-2 mb-1 inline-flex min-h-[44px] items-center gap-1 rounded-[var(--radius-sm)] pl-1 pr-2.5 text-[16px] font-semibold text-clay-ink transition-colors hover:text-hero active:bg-surface-2 ${
            backMobileOnly ? "sm:hidden" : ""
          }`}
        >
          <IconChevronLeft className="h-5 w-5" strokeWidth={2} />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-0.5 text-[15px] font-medium text-ink-2">{eyebrow}</p>}
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-[16px] leading-snug text-ink-2">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 pt-0.5">{action}</div>}
      </div>
    </header>
  );
}
