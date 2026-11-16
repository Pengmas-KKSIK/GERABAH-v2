# Rencana Migrasi GERABAH ke VPS Hostinger

Dibuat: 19 Oktober 2026 · Status: **menunggu pembelian domain & VPS**

## Keputusan

| | Pilihan |
|---|---|
| Domain | **.com** dibeli di Hostinger (~Rp150–230 rb/tahun) |
| Hosting aplikasi | **VPS Hostinger** (pindah dari Vercel) |
| Database & foto | Tetap di **Supabase** (Singapura), tidak dipindah |
| Email reset kata sandi | **Resend** (gratis 3.000 email/bulan) |

**Alasan pindah dari Vercel:** paket gratis (Hobby) tidak boleh untuk usaha komersial, sedangkan paket Pro
US$20/bulan (~Rp330 rb) dan bayar pakai dolar. VPS lebih murah dan dibayar dalam rupiah.

## 1. Saat membeli VPS

- Menu **VPS Hosting** (nama paket **KVM 1 / KVM 2 / …**). **Bukan** "Web Hosting" — paket yang
  menyebut "3 situs web, kotak surat, kredit AI" **tidak bisa** menjalankan aplikasi ini.
- Paket: **KVM 1** asalkan **RAM minimal 4 GB**. Kalau kurang dari 4 GB → ambil **KVM 2**.
- Periode: **12 bulan**. Cek juga **harga perpanjangan** sebelum bayar.
- Lokasi server: yang **paling dekat Singapura/Indonesia**.
- Sistem operasi: tab **OS biasa** → **Ubuntu 24.04 LTS** polos
  (jangan yang ada CloudPanel / cPanel / Coolify / WordPress / n8n).
- Password root: buat yang kuat dan **simpan sendiri** — jangan dikirim lewat chat.
- SSH key & malware scanner: boleh dilewati.

## 2. Saat membeli domain

- Cari nama `.com` yang diinginkan, isi data pemilik dengan data asli.
- Cek dulu apakah paket VPS memberi domain gratis supaya tidak bayar dua kali.

## 3. Setelah membeli — kirimkan ke Claude

- **IP address VPS** (hPanel → VPS → Overview)
- **Nama domain**

## 4. Langkah setup (dikerjakan bersama Claude)

1. **DNS:** di Hostinger, arahkan domain (A record `@` dan `www`) ke IP VPS.
2. **Server:** install Node.js LTS, PM2, Nginx (reverse proxy), SSL gratis Let's Encrypt,
   firewall (ufw), dan swap. Nginx: `client_max_body_size 25m;` (upload foto sampai 20MB).
3. **Deploy aplikasi** dengan env:
   `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (wajib — aplikasi menolak jalan tanpanya),
   `SUPABASE_SERVICE_ROLE_KEY` (wajib untuk upload foto), `ADMIN_WHATSAPP` (opsional).
   Migrasi database tetap dijalankan dari laptop (lihat `DEPLOY.md`).
4. **Script `deploy.sh`:** update aplikasi cukup satu perintah (git pull → install → build → restart).
5. **Aktifkan reset kata sandi lewat email** (lihat bagian 5).
6. Perbarui `DEPLOY.md` untuk VPS.

## 5. Reset kata sandi lewat email (Resend)

Fitur **sudah dibuat** tapi belum aktif dan belum di-commit:
`src/lib/password-reset.ts`, `src/app/reset-password/page.tsx`, `src/app/forgot-password/page.tsx`.

1. Daftar di **resend.com** → **API Keys → Create API Key**.
2. **Domains → Add Domain** → salin record DNS dari Resend ke panel DNS Hostinger → tunggu **Verified**.
3. Isi env di server:
   ```
   RESEND_API_KEY="re_xxxx"
   EMAIL_FROM="GERABAH <noreply@domainanda.com>"
   APP_URL="https://domainanda.com"
   ```
4. Uji kirim ke email sendiri dulu.

> Sebelum domain diverifikasi, Resend hanya bisa mengirim ke email pemilik akun Resend.

Sampai fitur ini aktif, reset kata sandi tetap manual oleh admin:
```
! npx tsx scripts/set-password.ts email@gmail.com KataSandiBaru
```

## Catatan terbuka

- Akun **Budi Aryono** terdaftar sebagai `budiaryono@gnqil.com` — kemungkinan salah ketik dari
  `@gmail.com`. Perlu diputuskan apakah diperbaiki.
