# Gerabara

Aplikasi pencatatan keuangan untuk UMKM gerabah: penjualan, pesanan, produk dan stok, pelanggan, piutang,
uang masuk dan keluar, workshop, serta laporan. Dibuat untuk dipakai langsung dari HP, dengan bahasa
sehari-hari dan tombol besar. Bagian dari Program Pengabdian Masyarakat KKSIK.

**Aplikasi:** https://sistempencatatankeuangan.vercel.app

## Layanan yang dipakai

| Layanan | Nama | Keterangan |
|---|---|---|
| GitHub | `Pengmas-KKSIK/sistempencatatankeuangan` | Branch `main` = produksi. Setiap PR otomatis dapat Preview Vercel. |
| Vercel | project `sistempencatatankeuangan` | Region `sin1` (Singapura). Merge ke `main` langsung ter-deploy. Alamat lama `gerabah-v2-whxs.vercel.app` dialihkan ke alamat baru. |
| Supabase | project `sistempencatatankeuangan` (org Pengmas KKSIK) | PostgreSQL + Storage bucket `uploads`, region Singapura. RLS aktif di semua tabel `public`. |

Cara deploy, environment variable, dan penanganan masalah deploy ada di [`DEPLOY.md`](./DEPLOY.md).

## Tech stack

- **Next.js 16** (App Router, Turbopack, Server Actions + `useActionState`)
- **PostgreSQL di Supabase** + **Prisma 7** (`@prisma/adapter-pg`)
- **Tailwind CSS v4**, desain token di `src/app/globals.css` (tema "Tanah Liat Hangat")
- Auth custom: JWT di cookie httpOnly + bcrypt (bukan NextAuth)
- PDF: `pdf-lib` (invoice dan laporan, di server). Excel: `write-excel-file`
- Font: Plus Jakarta Sans, logo memakai Urbanist. Bahasa: Indonesia

## Menjalankan di komputer

Langkah membuat `.env` ada di [`SETUP.md`](./SETUP.md). Setelah `.env` terisi:

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env` lokal biasanya menunjuk ke database produksi. Hati-hati saat mencoba fitur yang menghapus atau
mengubah data.

### Pemeriksaan sebelum push

```bash
npm run check      # typecheck + lint + tes unit (vitest)
npm run build
```

### Mengubah skema database

Migrasi **tidak** dijalankan saat build Vercel. Jalankan dari komputer **sebelum** push:

```bash
npx prisma migrate dev --name nama_perubahan   # buat migrasi baru
npx prisma migrate deploy                      # terapkan ke Supabase (pakai DIRECT_URL)
```

Lalu commit folder `prisma/migrations` bersama kodenya.

## Skrip admin

Dijalankan dari komputer yang punya `.env` produksi.

| Perintah | Fungsi |
|---|---|
| `npx tsx scripts/set-password.ts <email> <password>` | Atur ulang kata sandi pengguna (minimal 8 karakter) |
| `npx tsx scripts/db-check.ts` | Cek koneksi database dan isi tabel inti |
| `npx tsx scripts/reset-account.ts <email>` | Hapus satu akun beserta seluruh data usahanya (permanen) |
| `npx tsx scripts/reset-data.ts` | Kosongkan **seluruh** database, semua akun (permanen) |

## Struktur kode

| Lokasi | Isi |
|---|---|
| `prisma/schema.prisma` | Skema database |
| `src/app/(app)/` | Halaman yang butuh login (hanya tampilan + baca data) |
| `src/app/api/` | Unduhan: invoice PDF, laporan PDF, laporan Excel |
| `src/lib/actions/` | Server action per modul, **satu-satunya tempat data diubah** |
| `src/lib/actions/_helpers.ts` | Helper action: `run`, `UserError`, pembaca form, lookup kategori, log aktivitas |
| `src/lib/domain/` | Aturan bisnis murni + tesnya: pembayaran, alur status pesanan, hitungan workshop |
| `src/lib/form-parse.ts` | Pembaca input form (angka, tanggal, daftar barang). Semua input dianggap tidak tepercaya |
| `src/lib/date-range.ts` | Semua hitungan tanggal dalam **WIB**, bukan zona waktu server |
| `src/lib/guards.ts` | `requireContext` / `requireBusiness` / `requireOwner` |
| `src/lib/receivables.ts` · `reports.ts` | Satu sumber angka "belum lunas" dan laporan (Beranda, Laporan, PDF sama) |
| `src/lib/stock.ts` | Ubah stok secara atomik (tidak bisa minus walau ada transaksi bersamaan) |
| `src/lib/brand.ts` | Nama dan tagline aplikasi |
| `src/components/` | Komponen tampilan (`ui.tsx`, `form.tsx`, `*-form.tsx`, …) |

### Aturan saat menambah fitur

1. **Setiap server action wajib memanggil penjaga akses** (`requireBusiness`/`requireOwner`) dan
   mencari data dengan `businessId`. Menyembunyikan tombol bukan pengaman.
2. Pesan untuk pengguna dilempar dengan `throw new UserError("…")`. Error lain otomatis jadi pesan
   umum supaya detail teknis tidak bocor.
3. Perubahan uang atau stok yang bisa diklik dua kali dibuat **bersyarat** (`updateMany` dengan kondisi
   status lama) di dalam `prisma.$transaction`.
4. Tanggal dibaca dan ditampilkan lewat `date-range.ts` dan `format.ts` (WIB), jangan
   `new Date("YYYY-MM-DD")`.
5. Tabel baru yang punya `businessId` juga harus ikut terhapus oleh skrip reset di `scripts/`.

## Dokumen lain

| Dokumen | Isi |
|---|---|
| [`DEPLOY.md`](./DEPLOY.md) | Deploy ke Vercel, environment variable, upload foto, masalah deploy |
| [`SETUP.md`](./SETUP.md) | Menyiapkan Supabase dan `.env` dari nol |
| [`docs/PENDING.md`](./docs/PENDING.md) | Pekerjaan yang belum selesai |
| [`docs/EVALUASI-DAN-RENCANA-PENGEMBANGAN.md`](./docs/EVALUASI-DAN-RENCANA-PENGEMBANGAN.md) | Evaluasi dan rencana fitur |
| [`docs/RENCANA-UI-UX.md`](./docs/RENCANA-UI-UX.md) | Rencana desain tampilan |
| [`docs/RENCANA-MIGRASI-VPS.md`](./docs/RENCANA-MIGRASI-VPS.md) | Rencana pindah dari Vercel ke VPS |
| [`docs/FORMULIR-PENCATATAN-MANUAL.md`](./docs/FORMULIR-PENCATATAN-MANUAL.md) | Formulir pencatatan manual (juga versi .docx) |
| `docs/Arsitektur-Web-GERABAH.docx` | Gambaran arsitektur (versi lengkap menyusul di PR #3) |
