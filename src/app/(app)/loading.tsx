// Kerangka abu-abu selama data halaman dimuat, mengikuti tata letak umum halaman.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat…</span>
      <div className="skeleton mb-2 h-4 w-28" />
      <div className="skeleton mb-6 h-8 w-52" />
      <div className="skeleton mb-3 h-36 w-full rounded-[var(--radius-lg)]" />
      <div className="skeleton mb-8 h-20 w-full rounded-[var(--radius-lg)]" />
      <div className="skeleton mb-2.5 h-5 w-36" />
      <div className="skeleton h-48 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}
