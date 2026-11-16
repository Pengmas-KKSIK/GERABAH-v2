import Link from "next/link";

/** Pilihan berbentuk tab dalam satu jalur. Dirender di server; tab aktif dikirim dari halaman. */
export function Segmented({
  options,
  active,
  label,
}: {
  options: { key: string; label: string; href: string }[];
  active: string;
  /** Nama kelompok untuk pembaca layar, mis. "Periode". */
  label?: string;
}) {
  return (
    <nav aria-label={label} className="segment no-scrollbar w-full overflow-x-auto sm:w-fit">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          scroll={false}
          aria-current={active === o.key ? "page" : undefined}
          className="segment-item shrink-0 sm:flex-none"
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
