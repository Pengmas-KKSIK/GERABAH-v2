import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/current-user";
import { IconWallet, IconBox, IconReceipt, IconChart } from "@/components/icons";
import { Logo } from "@/components/logo";

const FEATURES = [
  { icon: IconWallet, title: "Uang masuk & keluar", body: "Catat sekali sehari. Saldo kas usaha selalu terlihat." },
  { icon: IconBox, title: "Produk & stok", body: "Harga jual, biaya produksi, dan untung per barang otomatis." },
  { icon: IconReceipt, title: "Penjualan & pesanan", body: "Stok berkurang sendiri, invoice PDF siap dikirim ke WhatsApp." },
  { icon: IconChart, title: "Laba rugi sederhana", body: "Tahu untung atau rugi tiap bulan, tanpa istilah akuntansi." },
];

export default async function LandingPage() {
  if (await getSessionContext()) redirect("/dashboard");

  return (
    <main className="min-h-dvh">
      {/* Sampul foto penuh */}
      <section className="relative flex min-h-[86dvh] items-end overflow-hidden bg-ink">
        <Image src="/images/wheel.webp" alt="Tangan perajin membentuk tanah liat di atas meja putar" fill priority sizes="100vw" className="object-cover" />
        <div className="cover-shade absolute inset-0" />
        <div className="absolute inset-x-0 top-0">
          <div className="mx-auto w-full max-w-5xl px-5 pt-5 sm:px-8 sm:pt-7">
            <Logo size={48} tile tone="white" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8 sm:pb-16">
          <h1 className="max-w-xl text-[34px] font-bold leading-[1.1] text-white sm:text-[52px]">
            Catatan keuangan usaha, sesederhana menulis di buku.
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/90 sm:text-[17px]">
            Dibuat untuk perajin gerabah. Bahasa sehari-hari, tombol besar, langsung dari HP.
          </p>
          <div className="mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row">
            <Link href="/signup" className="btn btn-primary sm:flex-1">
              Buat Akun Gratis
            </Link>
            <Link href="/login" className="btn bg-white text-ink hover:bg-canvas sm:flex-1">
              Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 className="max-w-md text-[26px] font-bold leading-tight text-ink sm:text-[32px]">
          Semua yang dibutuhkan usaha kecil, tanpa yang tidak perlu.
        </h2>
        <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3.5">
              <f.icon className="mt-0.5 h-6 w-6 shrink-0 text-clay" strokeWidth={1.8} />
              <div>
                <p className="text-[17px] font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Foto + ajakan */}
      <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        <div className="grid overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface sm:grid-cols-2">
            <div className="relative h-56 sm:h-auto">
              <Image src="/images/workshop.webp" alt="Perajin mengajari anak membuat gerabah" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6 sm:p-10">
              <h2 className="text-[22px] font-bold leading-snug text-ink">Bisa dipakai bersama staf dan untuk workshop.</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                Undang staf untuk mencatat penjualan, hitung biaya kelas workshop, dan cetak laporan bulanan dalam satu
                aplikasi.
              </p>
              <Link href="/signup" className="btn btn-primary mt-6">
                Mulai Sekarang
              </Link>
            </div>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-3 px-5 pb-10">
        <Logo size={36} />
        <p className="text-center text-[13px] text-ink-3">
          Program Pengabdian Masyarakat PPMI KKSIK ITB · Desa Sitiwinangun, Cirebon
        </p>
      </footer>
    </main>
  );
}
