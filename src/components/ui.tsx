import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconChevronRight,
  IconChevronDown,
  IconInfo,
  IconAlert,
  IconCheck,
  IconHourglass,
  IconArrowDown,
  IconArrowUp,
} from "./icons";

/* ── Card ── */
export function Card({
  className = "",
  children,
  as: As = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section";
}) {
  return <As className={`card p-4 ${className}`}>{children}</As>;
}

/* ── Judul bagian: kalimat biasa, bukan huruf kapital semua ── */
export function SectionTitle({
  children,
  action,
  className = "",
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-2.5 mt-8 flex items-baseline justify-between gap-3 ${className}`}>
      <h2 className="text-[19px] font-bold leading-snug text-ink">{children}</h2>
      {action}
    </div>
  );
}

/** Tautan "Lihat semua" di samping judul bagian. */
export function SeeAll({ href, label = "Lihat semua" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="link -my-2.5 py-2.5 text-[15px]">
      {label}
    </Link>
  );
}

/* ── Warna teks untuk arus uang & status ── */
const TEXT_TONE = {
  ink: "text-ink",
  in: "text-teal",
  out: "text-clay",
  good: "text-good",
  bad: "text-bad",
  warn: "text-warn",
  muted: "text-ink-3",
} as const;
export type TextTone = keyof typeof TEXT_TONE;

/* ── Ubin penanda: ikon di kotak berwarna menurut kelompoknya ──
   tanah liat = jualan · teal = uang · oker = barang · daun = orang · batu = aplikasi */
const TILE = {
  clay: "bg-clay-soft text-clay-ink",
  teal: "bg-teal-soft text-teal",
  ochre: "bg-ochre-soft text-ochre",
  leaf: "bg-leaf-soft text-leaf",
  stone: "bg-surface-2 text-ink-2",
} as const;
export type TileTone = keyof typeof TILE;

export function Tile({
  tone = "stone",
  size = 44,
  round = false,
  children,
  className = "",
}: {
  tone?: TileTone;
  size?: number;
  round?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center ${round ? "rounded-full" : "rounded-[12px]"} ${TILE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Kotak Hero: angka utama halaman, satu per halaman ──
   Cokelat tanah liat dengan siluet kendi. Isi tambahan (`children`) harus memakai
   HeroNote, FlowPair, HeroLink, atau HeroPanel supaya tetap terbaca di atas latar gelap. */
export function Hero({
  label,
  value,
  aside,
  children,
  className = "",
}: {
  label: ReactNode;
  value: string;
  /** Tidak dipakai lagi (angka selalu putih); dipertahankan agar halaman lama tetap jalan. */
  tone?: TextTone;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative mb-4 overflow-hidden rounded-[var(--radius-xl)] bg-hero p-5 text-white ${className}`}>
      <svg
        aria-hidden
        viewBox="0 0 74 92"
        className="pointer-events-none absolute -right-3 -top-1.5 h-[130px] w-[104px] fill-hero-2"
      >
        <path d="M26 4h22v7c0 6 20 14 20 38 0 20-13 36-31 36S6 69 6 49C6 25 26 17 26 11z" />
      </svg>
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[15px] font-semibold text-hero-label">{label}</p>
        {aside}
      </div>
      <p className="figure relative mt-1 truncate text-[clamp(32px,10vw,40px)] font-extrabold">{value}</p>
      {children && <div className="relative mt-3">{children}</div>}
    </section>
  );
}

/** Keterangan satu baris di bawah angka Hero. */
export function HeroNote({ children }: { children: ReactNode }) {
  return <p className="text-[15px] font-medium leading-snug text-hero-label">{children}</p>;
}

/** Kotak putih di dalam Hero untuk isi yang lebih panjang (rincian, daftar). */
export function HeroPanel({ children }: { children: ReactNode }) {
  return <div className="rounded-[14px] bg-surface p-4 text-ink">{children}</div>;
}

/** Tautan satu angka di dalam Hero, mis. "Belum lunas". */
export function HeroLink({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[14px] bg-surface py-3 pl-3.5 pr-3 text-ink transition-colors active:bg-surface-2"
    >
      <Tile tone="teal" size={40}>
        {icon}
      </Tile>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-ink-2">{label}</span>
        <span className="tnum block truncate text-[18px] font-bold">{value}</span>
      </span>
      <IconChevronRight className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={2} />
    </Link>
  );
}

/** Pasangan angka masuk/keluar di dalam Hero: dua kotak putih dengan panah. */
export function FlowPair({ income, expense, incomeLabel = "Masuk", expenseLabel = "Keluar" }: {
  income: string;
  expense: string;
  incomeLabel?: string;
  expenseLabel?: string;
}) {
  return (
    <dl className="grid grid-cols-2 gap-2.5">
      <div className="min-w-0 rounded-[14px] bg-surface px-3 py-3 text-ink">
        <dt className="flex items-center gap-1.5 text-[14px] font-bold text-teal">
          <IconArrowDown className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {incomeLabel}
        </dt>
        <dd className="tnum mt-0.5 truncate text-[17px] font-bold">{income}</dd>
      </div>
      <div className="min-w-0 rounded-[14px] bg-surface px-3 py-3 text-ink">
        <dt className="flex items-center gap-1.5 text-[14px] font-bold text-clay">
          <IconArrowUp className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {expenseLabel}
        </dt>
        <dd className="tnum mt-0.5 truncate text-[17px] font-bold">{expense}</dd>
      </div>
    </dl>
  );
}

/* ── Kumpulan angka ringkas ──
   Dengan `icon`: daftar baris berubin + tanda panah (enak disentuh di HP).
   Tanpa `icon`: kartu berkolom bergaris pemisah (angka pendek di halaman Keuangan, dll.). */
export type StatItem = {
  label: string;
  value: string;
  sub?: string;
  tone?: TextTone;
  href?: string;
  icon?: ReactNode;
  marker?: TileTone;
};

export function StatGroup({ items, className = "" }: { items: StatItem[]; className?: string }) {
  if (items.some((s) => s.icon)) {
    return (
      <div className={`card overflow-hidden p-0 ${className}`}>
        {items.map((s) => {
          const body = (
            <>
              {s.icon && <Tile tone={s.marker ?? "stone"}>{s.icon}</Tile>}
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-tight text-ink-2">{s.label}</span>
                <span className={`tnum mt-0.5 block truncate text-[18px] font-bold ${TEXT_TONE[s.tone ?? "ink"]}`}>
                  {s.value}
                </span>
                {s.sub && <span className="block truncate text-[14px] text-ink-3">{s.sub}</span>}
              </span>
              {s.href && <IconChevronRight className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={2} />}
            </>
          );
          const cls = "flex min-h-[68px] items-center gap-3.5 border-b border-line px-4 py-3 last:border-b-0";
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} transition-colors hover:bg-canvas active:bg-surface-2`}>
              {body}
            </Link>
          ) : (
            <div key={s.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    );
  }

  const cols = items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className={`card grid ${cols} divide-x divide-line overflow-hidden p-0 ${className}`}>
      {items.map((s) => {
        const body = (
          <>
            <span className="label block leading-tight">{s.label}</span>
            <span className={`tnum mt-1 block truncate text-[19px] font-bold ${TEXT_TONE[s.tone ?? "ink"]}`}>
              {s.value}
            </span>
            {s.sub && <span className="mt-0.5 block truncate text-[14px] text-ink-3">{s.sub}</span>}
          </>
        );
        const cls = "min-w-0 px-3.5 py-3.5";
        return s.href ? (
          <Link key={s.label} href={s.href} className={`${cls} transition-colors hover:bg-canvas active:bg-surface-2`}>
            {body}
          </Link>
        ) : (
          <div key={s.label} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/* ── Badge: selalu ikon + tulisan, jadi tidak bergantung pada warna ── */
const BADGE = {
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  clay: "bg-clay-soft text-clay-ink",
  info: "bg-teal-soft text-teal",
  neutral: "bg-surface-2 text-ink-2",
} as const;
export type BadgeTone = keyof typeof BADGE;

const BADGE_ICON: Record<BadgeTone, ReactNode> = {
  good: <IconCheck className="h-4 w-4" strokeWidth={2.4} />,
  warn: <IconAlert className="h-4 w-4" strokeWidth={2.2} />,
  bad: <IconAlert className="h-4 w-4" strokeWidth={2.2} />,
  clay: <IconHourglass className="h-4 w-4" strokeWidth={2.2} />,
  info: <IconInfo className="h-4 w-4" strokeWidth={2.2} />,
  neutral: null,
};

export function Badge({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: BadgeTone;
  /** Ikon sendiri; `false` untuk tanpa ikon. Bila kosong, dipakai ikon bawaan nada. */
  icon?: ReactNode | false;
  children: ReactNode;
}) {
  const glyph = icon === false ? null : icon ?? BADGE_ICON[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pr-3 text-[14px] font-bold leading-6 ${
        glyph ? "pl-2" : "pl-3"
      } ${BADGE[tone]}`}
    >
      {glyph}
      {children}
    </span>
  );
}

/* ── List + Row ── */
export function List({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card overflow-hidden p-0 ${className}`}>{children}</div>;
}

export function Row({
  href,
  onClick,
  leading,
  title,
  meta,
  amount,
  amountTone = "ink",
  amountSub,
  status,
  trailing,
  chevron = true,
  stackAmount = false,
}: {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  amount?: string;
  amountTone?: TextTone;
  amountSub?: string;
  /** Label status (mis. Badge) di bawah keterangan, supaya judul tidak terpotong di HP. */
  status?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  /** Taruh angka di baris bawah (sejajar status) agar judul panjang punya lebar penuh di HP. */
  stackAmount?: boolean;
}) {
  const amountEl =
    amount != null ? (
      <div className="shrink-0 text-right">
        <p className={`tnum text-[17px] font-bold ${TEXT_TONE[amountTone]}`}>{amount}</p>
        {amountSub && <p className="tnum mt-0.5 text-[14px] text-ink-3">{amountSub}</p>}
      </div>
    ) : null;
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[17px] font-semibold leading-snug text-ink">{title}</p>
        {meta && <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-ink-2">{meta}</p>}
        {(status || (stackAmount && amountEl)) && (
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">{status}</div>
            {stackAmount && amountEl}
          </div>
        )}
      </div>
      {!stackAmount && amountEl}
      {trailing}
      {(href || onClick) && chevron && <IconChevronRight className="-mr-1 h-5 w-5 shrink-0 text-ink-3" strokeWidth={2} />}
    </>
  );
  const cls = "flex min-h-[64px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0";
  const interactive = "transition-colors hover:bg-canvas active:bg-surface-2";
  if (href)
    return (
      <Link href={href} className={`${cls} ${interactive}`}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={`${cls} ${interactive}`}>
        {body}
      </button>
    );
  return <div className={cls}>{body}</div>;
}

/* ── Daftar pasangan label–nilai (rincian detail) ── */
export function DetailList({
  rows,
  className = "",
}: {
  rows: [ReactNode, ReactNode][];
  className?: string;
}) {
  return (
    <dl className={`card divide-y divide-line px-4 py-1 ${className}`}>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="shrink-0 text-[15px] text-ink-2">{k}</dt>
          <dd className="min-w-0 text-right text-[16px] font-semibold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Status kosong: apa ini, kenapa kosong, langkah pertama ── */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      {icon && (
        <Tile tone="clay" size={56} className="mb-4">
          {icon}
        </Tile>
      )}
      <p className="text-[19px] font-bold text-ink">{title}</p>
      <p className="mt-1.5 max-w-xs text-[16px] leading-relaxed text-ink-2">{body}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/* ── Catatan / peringatan ── */
export function Callout({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" }) {
  const warn = tone === "warn";
  const Icon = warn ? IconAlert : IconInfo;
  return (
    <div
      role={warn ? "status" : undefined}
      className={`flex gap-2.5 rounded-[var(--radius-lg)] px-4 py-3.5 text-[15px] leading-relaxed ${
        warn ? "bg-clay-soft text-ink" : "bg-ochre-soft text-ink"
      }`}
    >
      <Icon className={`mt-0.5 h-[22px] w-[22px] shrink-0 ${warn ? "text-clay-ink" : "text-ochre"}`} strokeWidth={2} />
      <div>{children}</div>
    </div>
  );
}

/* ── Bagian buka-tutup (dipakai untuk form "Tambah …" yang jarang dipakai) ── */
export function Disclosure({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="disclosure card overflow-hidden p-0" open={defaultOpen}>
      <summary className="flex min-h-[60px] items-center gap-3 px-4 text-[17px] font-bold text-ink transition-colors hover:bg-canvas">
        {icon && <span className="text-clay">{icon}</span>}
        <span className="flex-1">{title}</span>
        <IconChevronDown className="disclosure-chevron h-5 w-5 text-ink-3" strokeWidth={2} />
      </summary>
      <div className="border-t border-line p-4">{children}</div>
    </details>
  );
}

/* ── Gambar produk kecil: foto, atau huruf depan di ubin oker ── */
export function ProductThumb({ name, photoUrl, size = 56 }: { name: string; photoUrl?: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (photoUrl)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" style={style} className="shrink-0 rounded-[12px] object-cover" />;
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className="flex shrink-0 items-center justify-center rounded-[12px] bg-ochre-soft font-extrabold text-ochre"
    >
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

/* ── Label isian ── */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[14px] text-ink-3">{hint}</span>}
    </label>
  );
}

/* ── Avatar (inisial) ── */
export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const text = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-[15px] font-bold text-leaf ${className}`}
    >
      {text || "?"}
    </span>
  );
}

/* ── Progress bar ── */
export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-clay" style={{ width: `${Math.min(Math.max(value, 2), 100)}%` }} />
    </div>
  );
}

/* ── Penanda arah uang di daftar transaksi: ubin teal (masuk) atau tanah liat (keluar) ── */
export function FlowChip({ dir }: { dir: "in" | "out" }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${
        dir === "in" ? "bg-teal-soft text-teal" : "bg-clay-soft text-clay-ink"
      }`}
      aria-label={dir === "in" ? "Uang masuk" : "Uang keluar"}
      role="img"
    >
      {dir === "in" ? (
        <IconArrowDown className="h-[22px] w-[22px]" strokeWidth={2.2} />
      ) : (
        <IconArrowUp className="h-[22px] w-[22px]" strokeWidth={2.2} />
      )}
    </span>
  );
}
