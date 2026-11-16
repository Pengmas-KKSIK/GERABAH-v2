import { getCurrentUser, getCurrentBusiness } from "@/lib/current-user";
import { ADMIN_WHATSAPP } from "@/lib/config";
import { waUrl } from "@/lib/whatsapp";
import { Card, Callout, SectionTitle } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { IconMessage, IconChevronDown } from "@/components/icons";

const FAQ = [
  {
    q: "Bagaimana mencatat uang masuk atau keluar?",
    a: "Tekan tombol Catat (tombol + di tengah bawah layar HP, atau di kiri atas di komputer), lalu pilih Uang Masuk atau Uang Keluar.",
  },
  {
    q: "Apa beda Penjualan dan Pesanan?",
    a: "Penjualan untuk barang yang langsung terjual. Pesanan untuk barang yang dikerjakan dulu, dibayar kemudian — saat ditandai Selesai otomatis jadi penjualan.",
  },
  {
    q: "Bagaimana menagih pembeli yang belum bayar?",
    a: "Buka menu Belum Lunas. Semua tagihan tampil di sana lengkap dengan tombol pengingat WhatsApp.",
  },
  {
    q: "Bagaimana mengunduh laporan keuangan?",
    a: "Buka menu Laporan, pilih periode, lalu tekan Unduh PDF atau Unduh Excel.",
  },
];

export default async function HelpPage() {
  const [user, business] = await Promise.all([getCurrentUser(), getCurrentBusiness()]);

  const chatLink = waUrl(
    ADMIN_WHATSAPP,
    `Halo Admin Gerabara, saya ${user?.name ?? ""}` +
      (business?.name ? ` dari usaha ${business.name}` : "") +
      `. Saya mau tanya: `
  );

  return (
    <>
      <PageHeader title="Bantuan" subtitle="Pertanyaan umum, atau hubungi admin langsung" />

      <Card className="mb-5">
        <h2 className="text-[17px] font-semibold text-ink">Masih bingung atau ada kendala?</h2>
        <p className="mt-1 text-[15px] text-ink-2">
          Kirim pertanyaanmu ke admin lewat WhatsApp. Nama dan nama usaha sudah otomatis terisi.
        </p>
        {chatLink ? (
          <a href={chatLink} target="_blank" rel="noreferrer" className="btn btn-primary mt-4 w-full">
            <IconMessage className="h-[18px] w-[18px]" strokeWidth={2} />
            Chat Admin via WhatsApp
          </a>
        ) : (
          <div className="mt-3">
          <Callout tone="warn">
            Nomor admin belum diatur. Hubungi pengelola aplikasi untuk bantuan.
          </Callout>
          </div>
        )}
      </Card>

      <SectionTitle>Pertanyaan yang sering ditanya</SectionTitle>
      <div className="card divide-y divide-line overflow-hidden p-0">
        {FAQ.map((f) => (
          <details key={f.q} className="disclosure">
            <summary className="flex min-h-[56px] items-center gap-3 px-4 py-3 text-[16px] font-medium text-ink transition-colors hover:bg-canvas">
              <span className="flex-1">{f.q}</span>
              <IconChevronDown className="disclosure-chevron h-5 w-5 shrink-0 text-ink-3" strokeWidth={2} />
            </summary>
            <p className="px-4 pb-4 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
