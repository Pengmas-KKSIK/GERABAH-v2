# GERABAH v2

Versi bangun-ulang dari aplikasi pencatatan keuangan UMKM gerabah. Fokus: UI/UX yang bersih, netral, dan
intuitif; alur pendek; bahasa sehari-hari. Dibuat terpisah dari versi lama (`../APK Cata Uang UMKM Gerabah`)
yang tetap utuh.

## Tech stack

- **Next.js 16** (App Router, Turbopack, Server Actions + `useActionState`)
- **PostgreSQL di Supabase** + **Prisma 7** (`@prisma/adapter-pg`)
- **Tailwind CSS v4** — desain token di `src/app/globals.css`
- Auth custom: JWT httpOnly cookie + bcrypt (bukan NextAuth)
- Invoice PDF: `pdf-lib` (server, tanpa browser)
- Font: Plus Jakarta Sans · Bahasa: Indonesia

## Yang berbeda dari v1

- **Sistem desain baru**: kanvas warm-white, kartu putih, satu aksen clay (`#C2410C`), alur uang
  teal/clay yang aman untuk buta warna. Tidak ada serif dekoratif.
- **Semua form pakai `useActionState`** — error tampil inline, tombol punya state "menyimpan", tidak ada
  lagi form yang membeku diam-diam.
- **Onboarding idempotent** — kalau gagal separuh jalan, aman diulang; tidak menolak dengan 409.
- **Skema bersih** — tabel `Post*` komunitas dibuang, `onDelete: Cascade` dipasang dari `Business` ke
  bawah supaya reset data satu akun tidak perlu hapus manual berjenjang.
- Navigasi: tab bar bawah + tombol "Catat" mengambang di HP; sidebar penuh di desktop.

## Setup pertama kali

Lihat [`SETUP.md`](./SETUP.md) — bikin project Supabase baru, isi `.env`, jalankan migrasi.

Setelah `.env` terisi:

```bash
npm install
npx prisma migrate dev --name init   # butuh Session pooler (port 5432)
npm run dev                          # http://localhost:3000
```

## Struktur

| Lokasi | Isi |
|---|---|
| `prisma/schema.prisma` | Skema database |
| `src/app/(app)/` | Halaman yang butuh login (hanya tampilan + baca data) |
| `src/app/api/` | Unduhan: invoice PDF, laporan PDF, laporan Excel |
| `src/lib/actions/` | Server action per modul — **satu-satunya tempat data diubah** |
| `src/lib/actions/_helpers.ts` | Helper action: `run`, `UserError`, penjaga akses, pembaca form, lookup kategori, log aktivitas |
| `src/lib/domain/` | Aturan bisnis murni + tesnya: pembayaran, alur status pesanan, hitungan workshop |
| `src/lib/form-parse.ts` | Pembaca input form (angka, tanggal, daftar barang) — semua input dianggap tidak tepercaya |
| `src/lib/date-range.ts` | Semua hitungan tanggal dalam **WIB**, bukan zona waktu server |
| `src/lib/guards.ts` | `requireContext` / `requireBusiness` / `requireOwner` |
| `src/lib/receivables.ts` · `reports.ts` | Satu sumber angka "belum lunas" & laporan (Beranda, Laporan, PDF sama) |
| `src/lib/stock.ts` | Ubah stok secara atomik (tidak bisa minus walau ada transaksi bersamaan) |
| `src/components/` | Komponen tampilan (`ui.tsx`, `form.tsx`, `*-form.tsx`, …) |

### Aturan saat menambah fitur

1. **Setiap server action wajib memanggil penjaga akses** (`requireBusiness`/`requireOwner`) dan
   mencari data dengan `businessId` — menyembunyikan tombol bukan pengaman.
2. Pesan untuk pengguna dilempar dengan `throw new UserError("…")`. Error lain otomatis jadi pesan
   umum supaya detail teknis tidak bocor.
3. Perubahan uang/stok yang bisa diklik dua kali dibuat **bersyarat** (`updateMany` dengan kondisi
   status lama) di dalam `prisma.$transaction`.
4. Tanggal dibaca/ditampilkan lewat `date-range.ts` & `format.ts` (WIB), jangan `new Date("YYYY-MM-DD")`.

### Pemeriksaan

```bash
npm run check   # typecheck + lint + tes unit (vitest)
npm run build
```

## Belum selesai

Lihat [`docs/PENDING.md`](./docs/PENDING.md).
