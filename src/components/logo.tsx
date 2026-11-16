import Image from "next/image";
import { APP_NAME } from "@/lib/brand";

/**
 * Logo Gerabara: gambar kendi + tulisan nama.
 *
 * - Gambar: /brand/gerabara-mark.svg (kendi, koin, ombak mega mendung).
 * - Tulisan: huruf Urbanist tebal (`font-brand`), huruf kecil semua, sama dengan berkas logonya.
 * - `size` = tinggi gambar dalam px; ukuran tulisan dan jarak mengikuti perbandingan di berkas logo.
 * - `tile` menaruh gambar di kotak krem membulat (bentuk ikon aplikasi) — pakai di atas foto atau latar gelap.
 * - `tone="white"` untuk tulisan di atas foto atau latar gelap.
 */
const MARK_RATIO = 1632 / 2004; // lebar : tinggi berkas gambar

export function Logo({
  size = 36,
  tone = "ink",
  tile = false,
  wordmark = true,
  className = "",
}: {
  size?: number;
  tone?: "ink" | "white";
  tile?: boolean;
  wordmark?: boolean;
  className?: string;
}) {
  const markH = tile ? Math.round(size * 0.72) : size;
  const mark = (
    <Image
      src="/brand/gerabara-mark.svg"
      alt={wordmark ? "" : APP_NAME}
      width={Math.round(markH * MARK_RATIO)}
      height={markH}
      priority
      className="block shrink-0"
    />
  );

  return (
    <span className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * (tile ? 0.24 : 0.2)) }}>
      {tile ? (
        <span
          className="flex shrink-0 items-center justify-center bg-brand-cream"
          style={{ width: size, height: size, borderRadius: Math.round(size * 0.225) }}
        >
          {mark}
        </span>
      ) : (
        mark
      )}
      {wordmark && (
        <span
          className={`font-brand font-bold lowercase leading-none tracking-[-0.01em] ${
            tone === "white" ? "text-white" : "text-brand-ink"
          }`}
          style={{ fontSize: Math.round(size * (tile ? 0.5 : 0.56)) }}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
