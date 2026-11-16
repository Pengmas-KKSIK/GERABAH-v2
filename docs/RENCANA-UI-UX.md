# GERABAH — Audit & Rencana Perbaikan UI/UX

**Dibuat:** 14 November 2026
**Lingkup:** seluruh aplikasi (25 layar di dalam aplikasi, 6 layar publik/akun, 30 komponen), tampilan HP 390 px dan desktop 1280 px.
**Cara audit:** semua berkas di `src/app` dan `src/components` dibaca, lalu aplikasi dijalankan dengan basis data uji lokal (bukan data Supabase asli) dan 56 tangkapan layar diambil sebagai kondisi awal.
**Batasan:** rencana ini hanya menyentuh tampilan, tata letak, teks antarmuka, dan aksesibilitas. Logika keuangan, server action, skema basis data, dan PDF tidak diubah.

Hal yang belum diketahui ditandai `[fill this in]` dan dikumpulkan di bagian 7.

---

## 1. Ringkasan temuan

### 1.1 Kesan umum

Fondasi aplikasi ini sudah baik: ada token warna di satu tempat, satu warna aksen, warna uang masuk/keluar yang aman untuk buta warna (teal dan tanah liat, bukan hijau/merah), bahasa sehari-hari, status kosong di tiap daftar, dan form yang menampilkan galat di tempat. Masalahnya bukan "berantakan", melainkan **terlalu banyak hiasan di atas fondasi yang sebenarnya rapi**, ditambah beberapa celah navigasi dan aksesibilitas yang nyata.

Yang paling menarik mata saat ini adalah hiasan (foto sampul, kartu gelap bercahaya, tombol oranye berbayang), bukan angka yang dicari pengguna. Itu terbalik.

### 1.2 Temuan utama, urut dari yang paling berdampak

| # | Temuan | Bukti di kode | Dampak | Tingkat |
|---|---|---|---|---|
| 1 | **Teks sekunder tidak terbaca.** `ink-3` (#9b958b) di atas putih hanya 2,97:1, di atas kanvas 2,73:1. Dipakai untuk semua keterangan baris, label, tanggal, petunjuk. | `globals.css` `--color-ink-3` | Pengguna berumur atau di luar ruangan tidak bisa membaca keterangan. Gagal WCAG 1.4.3 (butuh 4,5:1). | Kritis |
| 2 | **Zoom dimatikan.** `maximumScale: 1` di viewport. | `src/app/layout.tsx` | Pengguna berpenglihatan lemah tidak bisa memperbesar. Gagal WCAG 1.4.4. | Kritis |
| 3 | **Staf di desktop tidak punya tombol Keluar.** Keluar hanya ada di `/more` (khusus HP) dan `/settings` (khusus pemilik). Sidebar desktop tidak memuat keduanya untuk staf. | `nav.tsx`, `more/page.tsx`, `settings/page.tsx` | Staf di komputer bersama tidak bisa keluar dari akun. | Kritis |
| 4 | **Dialog konfirmasi memakai `window.confirm` bawaan browser.** Tampil berbahasa browser ("OK/Cancel"), tidak bisa diberi gaya, dan di PWA iOS kadang tidak muncul. | `action-button.tsx` | Aksi berisiko (hapus, selesaikan pesanan, catat ke keuangan) dikonfirmasi lewat dialog yang paling tidak ramah. | Tinggi |
| 5 | **Hiasan yang tidak membawa informasi** (ciri yang disebut "AI slop"): cahaya blur di kartu saldo, kilau bergerak di tombol utama, bayangan berwarna di tombol, foto stok di setiap status kosong, foto sampul di Beranda dengan efek mendekat, gradien di gambar produk, animasi masuk bergiliran di tiap halaman, angka berhitung naik, kartu terangkat saat disorot. | `ui.tsx` (`BalanceCard`, `EmptyState`, `CoverHeader`, `ProductThumb`), `globals.css` (`.btn-primary::after`, `.stagger`, `.slow-zoom`, `.lift`), `effects.tsx` | Mengalihkan perhatian dari angka, memperlambat rasa "langsung tampil", dan membuat tampilan terasa templat. | Tinggi |
| 6 | **Hierarki rata.** Hampir semua hal dibungkus kartu putih yang sama (radius 20, garis, bayangan), semua judul bagian huruf kapital kecil abu-abu, semua tombol berbentuk pil setinggi 52 px. | hampir semua `page.tsx` | Mata tidak tahu mana yang utama. Di Beranda ada 8 kotak sebelum daftar pertama. | Tinggi |
| 7 | **Ikon ganda dan ikon yang salah makna.** Tab "Menu" memakai ikon kotak yang sama dengan "Produk". "Belum Lunas" memakai ikon dompet yang sama dengan "Keuangan". Callout tips memakai ikon percikan. | `nav-items.ts`, `ui.tsx` | Pengguna yang mengandalkan ikon (bukan teks) salah tebak. | Sedang |
| 8 | **Tombol Kembali mengarah ke halaman khusus HP.** Aset dan Pengaturan kembali ke `/more`, yang di desktop hanya menduplikasi sidebar. | `assets/page.tsx`, `settings/page.tsx` | Di desktop pengguna mendarat di halaman yang tidak seharusnya ada. | Sedang |
| 9 | **Ukuran huruf terlalu kecil di beberapa tempat penting.** Label tahap pesanan 9,5 px, sumbu grafik 10 px, catatan kaki 11,5 px. | `orders/[id]/page.tsx`, `cashflow-chart.tsx` | Tidak terbaca oleh sasaran pengguna (belum terbiasa aplikasi digital). | Sedang |
| 10 | **Tidak konsisten antarhalaman.** Judul halaman 25 px di sebagian halaman dan 26 px di lainnya; 12 halaman menulis ulang header sendiri padahal ada `PageHeader`; label isian disalin 60+ kali sebagai `<span>` padahal ada komponen `Field`; tombol kecil dibuat dengan `!min-h-[44px] !px-4` berulang. | lihat 4.2 | Perubahan gaya harus dilakukan di puluhan tempat; mudah meleset. | Sedang |
| 11 | **Istilah tidak seragam.** "Owner" dan "Pemilik" dipakai bergantian; sisa tagihan disebut "Belum Lunas", "Belum Dibayar", "Utang", "Utang / Piutang", "Piutang", "Sisa tagihan"; "Bayar pakai" vs "Metode"; "Tempat jualan" vs "Dari" vs "Dari mana". | banyak halaman | Pengguna mengira itu hal yang berbeda. | Sedang |
| 12 | **Teks pengisi.** Callout tips di bawah daftar Keuangan, Produk, Belum Lunas, Laporan mengulang hal yang sudah dijelaskan status kosong atau judul halaman. | halaman terkait | Menambah panjang halaman tanpa menambah pemahaman. | Rendah |
| 13 | **Form pengaturan selalu terbuka.** Halaman Aset menampilkan dua form panjang (5 dan 7 isian) sekaligus dengan daftarnya; Pengaturan menampilkan form tambah staf terus-menerus. | `assets/page.tsx`, `settings/page.tsx` | Halaman sangat panjang; daftar yang ingin dilihat tenggelam. | Sedang |
| 14 | **Celah aksesibilitas lain.** Lembar "Mau catat apa?" tidak memindahkan fokus dan tidak punya nama; batang grafik tanpa nama untuk pembaca layar; tombol hapus berukuran 32 px; batas isian 1,42:1; tautan aktif tanpa `aria-current`; galat form tanpa `role="alert"`. | `nav.tsx`, `cashflow-chart.tsx`, `form.tsx`, `globals.css` | Pengguna keyboard dan pembaca layar terhambat. | Sedang |

### 1.3 Yang sudah baik dan dipertahankan

- Warna uang masuk teal dan uang keluar tanah liat, selalu disertai tanda + dan −.
- Bahasa sehari-hari ("Uang Masuk", "Bayar pakai", "Belum Lunas") dan contoh isian yang nyata.
- Tombol "Catat" di tengah bawah sebagai satu pintu masuk untuk empat jenis catatan.
- Status kosong yang menjelaskan apa, kenapa kosong, dan langkah pertama.
- Isian uang dengan pemisah ribuan otomatis, penghitung jumlah dengan tombol besar.
- `prefers-reduced-motion` sudah dihormati, ukuran isian 16 px mencegah zoom otomatis iOS.

---

## 2. Prinsip desain dan arah visual

Arah: **tenang, datar, dan jelas**, seperti aplikasi bawaan Apple (Pengaturan, Dompet, Pengingat). Bukan meniru tampilannya, melainkan memakai disiplinnya: sedikit warna, banyak ruang, hierarki dari ukuran huruf, dan daftar berkelompok.

### 2.1 Lima prinsip

1. **Angka dulu, hiasan tidak ada.** Yang terbesar di layar selalu angka atau judul yang dicari pengguna. Tidak ada elemen yang ada hanya supaya "ramai".
2. **Satu aksen.** Tanah liat (`#C2410C`) hanya untuk aksi utama dan uang keluar. Sisanya netral.
3. **Kelompokkan, jangan kotak-kotakkan.** Hal yang sejenis masuk satu daftar bergaris tipis, bukan kartu terpisah-pisah.
4. **Satu cara untuk satu hal.** Satu header halaman, satu label isian, satu ukuran tombol utama, satu istilah per konsep.
5. **Terbaca oleh semua.** Kontras minimal 4,5:1 untuk teks, sasaran sentuh minimal 44 px, teks minimal 12 px, zoom tidak dikunci.

### 2.2 Tipografi

- **Huruf:** tetap Plus Jakarta Sans (sudah terpasang, angka tabularnya rapi, dirancang di Indonesia). Tidak menambah huruf kedua.
- **Skala** (dari 9 ukuran acak menjadi 6):

| Peran | Ukuran / tebal | Dipakai untuk |
|---|---|---|
| Judul halaman | 28 px / 700 | `h1` semua halaman |
| Angka utama | 34–40 px / 700, tabular | saldo, untung, total |
| Judul bagian | 17 px / 650 | "Produk terlaris", "Catatan terakhir" |
| Isi | 16 px / 500 | judul baris, isian |
| Keterangan | 14 px / 400 | meta baris, bantuan |
| Kecil | 12–13 px / 500 | label angka, badge, sumbu grafik |

- Judul bagian **tidak lagi huruf kapital semua**. Huruf kapital kecil abu-abu berulang adalah salah satu pola yang paling terasa templat, dan lebih sulit dibaca.

### 2.3 Warna

| Token | Lama | Baru | Alasan |
|---|---|---|---|
| `canvas` | `#f7f5f2` | `#f5f5f3` | lebih netral, tetap sedikit hangat |
| `surface-2` | `#f3f0ec` | `#eeedea` | netral |
| `line` | `#ece8e2` | `#e6e4e0` | netral |
| `line-strong` | `#ddd8d0` | `#d2cfc9` | pemisah kuat |
| `field-line` (baru) | — | `#928e87` | batas isian 3,3:1 (WCAG 1.4.11) |
| `ink` | `#1c1a17` | `#1c1b19` | — |
| `ink-2` | `#67625a` | `#55514b` | 7,9:1 |
| `ink-3` | `#9b958b` | `#6f6a63` | 5,4:1 di putih, 4,9:1 di kanvas (dulu 2,97:1) |
| `warn` | `#b45309` | `#9a4a07` | 5,5:1 di latar lembutnya (dulu 4,43:1) |
| `clay`, `teal`, `good`, `bad` | — | tetap | sudah lolos 4,5:1 |

### 2.4 Bentuk, spasi, bayangan

- **Radius:** 20 (lembar), 16 (kartu), 12 (tombol, isian), 8 (kecil). Tombol utama **bukan pil lagi**; pil hanya untuk badge dan pilihan segmen.
- **Bayangan:** kartu tanpa bayangan (cukup garis). Bayangan hanya untuk hal yang benar-benar melayang: lembar, toast.
- **Spasi:** kelipatan 4. Jarak antarbagian 28 px, antarkartu 12 px, isi kartu 16 px.
- **Tombol:** tinggi 48 px (utama) dan 44 px (kecil, `.btn-sm`). Tanpa kilau, tanpa bayangan berwarna.

### 2.5 Ikon

- Tetap satu keluarga ikon garis (24 px, tebal 1,75) yang sudah ada.
- Satu ikon untuk satu makna: ikon baru untuk "Menu" (tiga garis) dan "Belum Lunas" (jam pasir), ikon info untuk catatan.
- Ikon tidak dipakai sebagai hiasan di status kosong berfoto; cukup ikon dalam lingkaran netral.
- Tidak ada emoji di antarmuka.

### 2.6 Animasi

Dipertahankan (punya fungsi): lembar naik dari bawah, toast, perubahan warna saat ditekan, skeleton saat memuat.
Dihapus (hiasan): animasi masuk bergiliran, foto mendekat, angka berhitung naik, kilau tombol, kartu terangkat, muncul saat digulir.
Halaman muncul dengan pudar 150 ms saja.

### 2.7 Komponen

| Komponen | Perubahan |
|---|---|
| `PageHeader` | dipakai di semua halaman; mendukung tombol aksi dan kembali yang hanya tampil di HP |
| `SectionTitle` | 17 px tebal, bukan kapital; dipakai menggantikan `<p className="label">` |
| `.field-label` | satu kelas untuk semua label isian |
| `Hero` (pengganti `BalanceCard`) | angka besar di atas kartu putih polos, tanpa latar gelap bercahaya |
| `StatGroup` | tiga angka ringkas dalam satu kartu bergaris pemisah, bukan tiga kotak |
| `EmptyState` | ikon + judul + penjelasan + aksi, tanpa foto |
| `Callout` | ikon info; hanya untuk petunjuk yang terkait keputusan |
| `ConfirmDialog` (baru) | pengganti `window.confirm`, tombol berlabel aksinya |
| `Disclosure` (baru) | form "Tambah …" yang bisa dibuka-tutup |
| `DetailList` (baru) | daftar pasangan label-nilai yang sekarang ditulis ulang di 8 halaman |

---

## 3. Perubahan per layar

Format: **Masalah → Solusi → Alasan.**

### 3.1 Beranda (`/dashboard`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Foto sampul 168 px mendorong angka untung ke bawah lipatan pertama di HP | Ganti dengan header teks: sapaan kecil + nama usaha sebagai judul | Angka adalah alasan pengguna membuka Beranda |
| Tiga kotak statistik terpisah + kartu untung + kartu grafik = 5 kartu berurutan | Kartu untung tetap satu; tiga statistik jadi satu kartu `StatGroup` | Mengurangi jumlah kotak, memperjelas kelompok |
| Label "MASUK"/"KELUAR" kapital kecil dengan lingkaran ikon | Label biasa + angka; ikon panah kecil tanpa lingkaran | Lebih tenang, tetap terbaca arah uangnya |
| "Ketuk batang untuk detail" juga tampil di desktop | "Pilih batang untuk detail" | Benar di kedua perangkat |
| Batang grafik tanpa nama untuk pembaca layar, label sumbu 10 px | `aria-label` tiap batang, label 12 px | WCAG 4.1.2 |
| Status kosong mengajak "Catat Uang Masuk" saja | Tetap, tanpa foto | — |

### 3.2 Keuangan (`/finance`, `/finance/new`, `/finance/[id]`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Kartu saldo gelap dengan dua cahaya blur dan warna teks khusus (`#8fd6e6`, `#ffb98f`) di luar token | `Hero` putih: saldo besar, masuk/keluar di bawahnya dengan token `teal`/`clay` | Hapus hiasan, pakai token |
| Dua tombol tidak sejajar namanya: "Uang Masuk" dan "Catat Uang Keluar" | "Uang Masuk" dan "Uang Keluar", sama bentuk; yang utama mengikuti tab aktif | Paralel, mudah dipindai |
| Callout tips di bawah daftar | Dihapus (pesan yang sama sudah ada di form catat) | Teks pengisi |
| Form catat: 5 label ditulis manual | `.field-label` | Konsistensi |
| Detail: tombol hapus memakai `window.confirm` | `ConfirmDialog` "Hapus catatan ini?" dengan tombol "Hapus" dan "Batal" | Jelas dan bisa dibaca |

### 3.3 Penjualan (`/sales`, `/sales/new`, `/sales/[id]`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Header ditulis ulang, tombol "Baru" dengan kelas paksa | `PageHeader` + `.btn-sm` | Konsistensi |
| Ringkasan "Total Penjualan / Belum Dibayar" berlabel kapital | `StatGroup` dua kolom | Sama dengan pola Beranda |
| Form: tiap barang dalam kartu dengan 3 isian bertumpuk; pilihan status pembayaran 12,5 px | Jumlah dan harga berdampingan di layar ≥ 400 px; pilihan status 14 px setinggi 44 px | Form lebih pendek; sasaran sentuh cukup |
| Bilah total gelap | Tetap satu-satunya elemen gelap di form, radius disamakan | Ini memang ringkasan akhir yang perlu menonjol |
| Detail: "Hubungi Pembeli (WhatsApp)" | "Ingatkan lewat WhatsApp" | Sama dengan istilah di Belum Lunas |
| Daftar pasangan label-nilai ditulis manual | `DetailList` | Konsistensi |

### 3.4 Pesanan (`/orders`, `/orders/new`, `/orders/[id]`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Label tahap 9,5 px di bawah lima garis | Satu baris teks "Tahap 2 dari 5 · Dikonfirmasi" + lima garis tanpa label kecil; `aria-label` lengkap | Terbaca; tetap terlihat progresnya |
| Dua badge bertumpuk di kanan total | Status pesanan sudah ada di baris tahap; di kartu total cukup badge pembayaran | Mengurangi duplikasi |
| "Batalkan Pesanan" tombol hantu merah tanpa penegasan | Tetap paling bawah, lewat `ConfirmDialog` | Aksi merusak harus dikonfirmasi dengan jelas |
| "Lihat penjualannya" baris tanpa kartu | Dibungkus `List` | Sama dengan baris lain |
| Label "Dari" / "Dari mana" | "Tempat pesan" | Seragam |

### 3.5 Belum Lunas (`/receivables`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Tiap tagihan satu kartu tinggi berisi tabel 3 baris + 2 tombol | Kartu ringkas: nama dan jumlah di baris pertama, "Pesanan · jatuh tempo 16 Nov" di baris kedua, dua tombol | Lebih banyak tagihan terlihat sekaligus |
| Tombol nonaktif dibuat dari `<span>` dengan opasitas | Jika nomor HP kosong, tombolnya berubah jadi "Tambah nomor HP" menuju halaman ubah pelanggan | Memberi jalan keluar, bukan jalan buntu |
| "Ingatkan (WA)" | "Kirim pengingat" | Singkatan tidak dikenal semua pengguna |
| Callout penjelasan tombol di bawah | Dipindah jadi satu kalimat di bawah judul | Dibaca sebelum dibutuhkan |

### 3.6 Produk (`/products`, `/products/new`, `/products/[id]`, `/products/[id]/edit`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Kartu gelap "Nilai stok" | `Hero` putih | Sama dengan Keuangan |
| Gambar pengganti produk bergradien | Latar netral polos dengan huruf depan | Hapus gradien |
| Callout tips di bawah daftar | Dihapus | Sudah dijelaskan di status kosong dan form |
| Detail: foto tanpa teks alternatif yang berguna, label kapital | `alt` nama produk, `SectionTitle` | Aksesibilitas, konsistensi |
| Form: isian "Kategori lain-lain" selebar 96 px dengan huruf 13 px, terpotong | Dua baris: nama biaya, lalu jumlah | Terbaca dan bisa diketik |
| Form: lima kartu terpisah tanpa judul | Judul bagian di tiap kelompok: "Info produk", "Bahan baku", "Biaya lain", "Harga jual", "Stok" | Pengguna tahu sedang di bagian mana |
| "menunggu persetujuan owner" | "pemilik" | Seragam |

### 3.7 Pelanggan (`/customers`, `/customers/[id]`, form)

| Masalah | Solusi | Alasan |
|---|---|---|
| Badge "Utang Rp …" | "Belum lunas Rp …" | Satu istilah |
| Kartu "Utang / Piutang" | "Belum dibayar" | Istilah akuntansi membingungkan |
| Catatan pelanggan miring | Tegak | Miring di ukuran kecil sulit dibaca |
| "Chat WhatsApp" | Tetap, dengan ikon pesan | — |

### 3.8 Workshop (`/workshop`, `/workshop/new`, `/workshop/[id]`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Kartu rekomendasi gelap dengan `!bg-ink` paksa | Kartu putih dengan angka penawaran besar | Konsisten dengan `Hero` |
| Pilihan Persen/Nominal berbentuk pil oranye penuh | Pilihan segmen netral seperti di tempat lain | Satu pola untuk pilihan |
| "Owner yang mencatat…" | "Pemilik yang mencatat…" | Seragam |

### 3.9 Aset & Biaya Tetap (`/assets`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Dua form panjang selalu terbuka | `Disclosure` "Tambah aset" dan "Tambah biaya tetap", tertutup bila sudah ada data | Daftar jadi fokus |
| Tombol hapus 32 px, "Nonaktifkan" 12 px | Sasaran 44 px, teks 13 px | WCAG 2.5.5 |
| Paragraf pembuka panjang | Dua kalimat pendek | Ringkas |
| Kembali ke `/more` | Tautan kembali hanya di HP | Lihat 4.1 |

### 3.10 Laporan (`/reports`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Laba bersih di kotak gelap di dalam kartu | Dipindah ke atas sebagai `Hero`: laba/rugi bersih + kalimat "Dari tiap Rp 100 pendapatan, Rp 73 jadi untung" | Kesimpulan dulu, rincian kemudian |
| Empat judul bagian kapital | `SectionTitle` | Konsistensi |
| Callout penjelasan laba bersih di bawah | Dilebur ke `Hero` | Dekat dengan angkanya |
| Penjelasan unduhan panjang | Satu kalimat | Ringkas |
| "Unduh Excel (.xlsx)" terpotong di HP | "Unduh Excel" | Muat di tombol |

### 3.11 Persetujuan, Log Aktivitas, Pengaturan, Bantuan

| Layar | Masalah | Solusi |
|---|---|---|
| Persetujuan | Tombol "Tolak" memakai ikon tempat sampah | Ikon silang; konfirmasi lewat `ConfirmDialog` |
| Log Aktivitas | Badge "Owner" | "Pemilik" |
| Pengaturan | Form tambah staf selalu terbuka; "Owner melihat…" ; tombol hapus kecil | `Disclosure`; "Pemilik"; sasaran 44 px |
| Bantuan | Empat kartu tanya-jawab; jawaban menyebut "lingkaran di tengah bawah" yang tidak ada di desktop | Satu daftar buka-tutup; "tombol Catat" |

### 3.12 Menu (`/more`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Tiap baris punya lingkaran ikon abu-abu | Ikon tanpa lingkaran | Lebih tenang, seperti Pengaturan iOS |
| Judul kelompok kapital | `SectionTitle` kecil | Konsistensi |

### 3.13 Halaman publik dan akun (`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/onboarding`)

| Masalah | Solusi | Alasan |
|---|---|---|
| Foto mendekat pelan dan kartu fitur muncul saat digulir | Foto diam; kartu langsung tampil | Hapus animasi hiasan. Foto dipertahankan karena foto perajin asli memberi identitas, bukan foto stok generik |
| Kartu fitur dengan lingkaran ikon oranye dan efek terangkat | Daftar fitur polos, ikon tanpa lingkaran | Tidak terlihat seperti tautan padahal bukan |
| Tombol "Masuk" kaca buram di atas foto | Tombol putih solid | Kontras pasti |
| Kalimat di atas foto login terpotong di HP | Dihapus di HP, tetap di desktop | Terpotong lebih buruk daripada tidak ada |

### 3.14 Galat, tidak ditemukan, memuat

| Masalah | Solusi |
|---|---|
| Label "GERABAH"/"404" kapital berjarak lebar | Disederhanakan |
| Skeleton berkilau | Tetap (punya fungsi), disesuaikan dengan tata letak baru |

---

## 4. Perubahan lintas aplikasi

### 4.1 Navigasi

- **Tab bawah HP:** Beranda, Keuangan, [Catat], Pesanan, Menu. Ikon Menu diganti tiga garis. Tombol Catat tetap di tengah, lebih kecil (52 px), tanpa cincin dan bayangan tebal.
- **Sidebar desktop:** ditambah blok akun di bawah (nama, peran, tombol Keluar) sehingga staf bisa keluar. Persetujuan menampilkan jumlah yang menunggu.
- **Tautan kembali:** halaman yang di desktop dicapai dari sidebar (Aset, Pengaturan) hanya menampilkan "Kembali" di HP.
- **`aria-current="page"`** pada tautan aktif; tautan "Lewati ke isi" untuk pengguna keyboard.
- **Lembar "Mau catat apa?":** diberi nama, fokus pindah ke dalam saat dibuka dan kembali ke tombol saat ditutup, Tab tidak keluar dari lembar.

### 4.2 Konsistensi

- Semua halaman memakai `PageHeader` (sekarang 12 halaman menulis header sendiri).
- Semua label isian memakai `.field-label` (sekarang 60+ salinan kelas yang sama).
- Tombol kecil memakai `.btn-sm` (sekarang 6 tempat memakai `!min-h-[44px] !px-4`).
- Warna di luar token (`#ffb4c0`, `#8fd6e6`, `#ffb98f`, `#f3dccb`) dihapus.
- **Kamus istilah** (satu istilah per konsep):

| Konsep | Dipakai | Tidak dipakai lagi |
|---|---|---|
| Pemilik usaha | Pemilik | Owner |
| Tagihan yang belum dibayar penuh | Belum lunas | Utang, Piutang, Belum Dibayar |
| Cara membayar | Bayar pakai | Metode |
| Tempat transaksi | Tempat jualan (penjualan), Tempat pesan (pesanan) | Dari, Dari mana |
| Pengingat WhatsApp | Kirim pengingat / Ingatkan lewat WhatsApp | Ingatkan (WA), Hubungi Pembeli (WhatsApp) |

### 4.3 Aksesibilitas (WCAG 2.1 AA)

| Kriteria | Perbaikan |
|---|---|
| 1.4.3 Kontras teks | `ink-3`, `ink-2`, `warn` digelapkan (lihat 2.3) |
| 1.4.4 Ubah ukuran teks | hapus `maximumScale: 1` |
| 1.4.11 Kontras non-teks | batas isian 3,3:1 |
| 2.1.1 / 2.4.3 Keyboard dan urutan fokus | fokus terkelola di lembar dan dialog |
| 2.4.1 Lewati blok | tautan "Lewati ke isi" |
| 2.5.5 Ukuran sasaran | tombol hapus, nonaktifkan, tampilkan sandi minimal 44 px |
| 3.3.1 Identifikasi galat | `role="alert"` pada galat form |
| 4.1.2 Nama, peran, nilai | nama untuk batang grafik, lembar, dialog, tahap pesanan; `aria-current` |

### 4.4 Status kosong, memuat, galat

- **Kosong:** satu pola: ikon netral, judul, satu kalimat, satu tombol. Tanpa foto.
- **Memuat:** skeleton tetap; tombol kirim menampilkan "Menyimpan…" (sudah ada).
- **Galat form:** tetap di tempat, ditambah `role="alert"`.
- **Galat halaman / 404:** disederhanakan, kalimat tetap.
- **Konfirmasi:** semua lewat `ConfirmDialog` dengan judul berupa pertanyaan spesifik, satu kalimat akibat, dan tombol berlabel aksinya.

---

## 5. Skill desain yang dipakai

| Skill | Dipakai di | Hasil |
|---|---|---|
| `design:design-critique` | Tahap 1, audit seluruh layar dari tangkapan layar dan kode | Bagian 1 dan 3 (kesan pertama, kegunaan, hierarki, konsistensi) |
| `design:accessibility-review` | Tahap 1 audit kontras/keyboard/sasaran sentuh; Tahap 2 pemeriksaan ulang | Bagian 1.2 (#1, #2, #14) dan 4.3 |
| `design:design-system` | Tahap 1 audit token dan komponen; Tahap 2 saat menyusun ulang `globals.css` dan `ui.tsx` | Bagian 2.2–2.7 dan 4.2 |
| `design:ux-copy` | Tahap 2 untuk kamus istilah, teks tombol, dialog konfirmasi, status kosong | Bagian 4.2 (kamus) dan teks di 3.x |
| `design:design-handoff` | Akhir Tahap 2 | Catatan serah terima di bagian 8 (token, komponen, status) |
| `design:user-research`, `design:research-synthesis` | **Tidak dipakai.** Tidak ada data riset pengguna (wawancara, uji pakai) di folder proyek. Lihat bagian 7. | — |

---

## 6. Urutan pengerjaan

Urutan berdasarkan dampak dibagi usaha. Fondasi dulu karena mengubah semua layar sekaligus.

### Prioritas 1 — Fondasi (mengubah semua layar)

- [x] 1.1 Token warna baru dan kontras (`globals.css`)
- [x] 1.2 Skala tipografi, radius, tombol tanpa kilau/bayangan, `.btn-sm`, `.field-label`
- [x] 1.3 Hapus animasi hiasan (`stagger`, `slow-zoom`, `lift`, `reveal`, hitung naik)
- [x] 1.4 Viewport: zoom diizinkan
- [x] 1.5 Komponen dasar: `PageHeader`, `SectionTitle`, `Hero`, `StatGroup`, `EmptyState`, `Callout`, `DetailList`, `ProductThumb`
- [x] 1.6 `ConfirmDialog` menggantikan `window.confirm`
- [x] 1.7 `Disclosure`

### Prioritas 2 — Navigasi

- [x] 2.1 Ikon Menu dan Belum Lunas; tab bawah dirapikan
- [x] 2.2 Sidebar: blok akun + Keluar, jumlah persetujuan
- [x] 2.3 Lembar Catat: nama, fokus, Tab terkurung
- [x] 2.4 `aria-current`, tautan "Lewati ke isi", kembali khusus HP

### Prioritas 3 — Layar harian

- [x] 3.1 Beranda (pemilik dan staf)
- [x] 3.2 Keuangan: daftar, catat, detail
- [x] 3.3 Penjualan: daftar, catat, detail
- [x] 3.4 Pesanan: daftar, buat, detail
- [x] 3.5 Belum Lunas

### Prioritas 4 — Data usaha

- [x] 4.1 Produk: daftar, detail, form
- [x] 4.2 Pelanggan: daftar, detail, form
- [x] 4.3 Workshop: daftar, hitung, detail
- [x] 4.4 Aset & Biaya Tetap

### Prioritas 5 — Pemilik dan lainnya

- [x] 5.1 Laporan
- [x] 5.2 Persetujuan, Log Aktivitas
- [x] 5.3 Pengaturan, Bantuan, Menu
- [x] 5.4 Halaman publik dan akun, galat, 404, memuat

### Prioritas 6 — Verifikasi

- [x] 6.1 `npm run check` (typecheck, lint, tes unit) dan `npm run build`
- [x] 6.2 Tangkapan layar sesudah, HP dan desktop, dibandingkan dengan kondisi awal
- [x] 6.3 Pemeriksaan ulang kontras dan keyboard
- [x] 6.4 Catatan serah terima (bagian 8)

---

## 7. Yang belum diketahui

- `[fill this in]` **Data pengguna nyata.** Belum ada hasil wawancara atau uji pakai dengan mitra UMKM. Semua keputusan di sini berdasarkan heuristik dan kode, bukan pengamatan pengguna. Saran: uji 5 tugas (catat uang keluar, catat penjualan, buat pesanan, kirim pengingat, unduh laporan) dengan 3–5 orang.
- `[fill this in]` **Perangkat mitra.** Ukuran layar dan versi Android/iOS yang dipakai mitra. Rencana ini menguji 390 px dan 1280 px.
- `[fill this in]` **Seberapa sering staf memakai desktop.** Menentukan seberapa penting temuan #3.
- `[fill this in]` **Identitas merek.** Apakah ada logo, warna, atau huruf resmi dari program/mitra. Saat ini hanya teks "GERABAH" dan ikon aplikasi.
- `[fill this in]` **Nama domain dan paket Hostinger.** Next.js dengan Server Actions butuh Node.js (VPS atau paket "Node.js app"), bukan hosting statis. Ini di luar lingkup UI tetapi menentukan cara pasang.
- `[fill this in]` **Foto di `public/images`.** Lisensi tercatat di `SUMBER-FOTO.txt`; perlu dipastikan boleh dipakai di domain publik.

## 8. Catatan serah terima

Dikerjakan 14 November 2026. Tahap 1 (analisis dan rencana) memakai model Fable 5.2, Tahap 2 (pengerjaan) memakai Opus 5.5. Logika keuangan, skema database, dan aksi server tidak diubah, kecuali teks yang tampil ke pengguna dan satu kolom tampilan (lihat 8.5).

### 8.1 Hasil verifikasi

- `npx tsc --noEmit`, `npm run lint`, 34 tes unit, dan `npm run build` lolos.
- Diuji pada database Postgres lokal berisi data contoh, bukan database Supabase asli.
- Keyboard: Tab pertama memfokuskan "Lewati ke isi"; dialog konfirmasi hapus membuka dengan fokus di "Batal", Escape menutupnya dan fokus kembali ke tombol pemicu.
- Kontras (WCAG 2.1 AA, teks minimal 4,5:1, garis kontrol minimal 3:1):

| Pasangan | Rasio |
|---|---|
| `ink-2` di putih | 7,88 |
| `ink-3` di putih / di kanvas | 5,36 / 4,91 |
| `field-line` (garis kolom isian) di putih | 3,26 |
| Teks putih di tombol utama (`clay`) | 5,18 |
| `teal` di putih / di `teal-soft` | 5,36 / 4,67 |
| `good`, `warn`, `bad` di latar lembutnya | 4,76 / 5,52 / 5,47 |
| `clay-ink` di `clay-soft` | 6,42 |

### 8.2 Token (src/app/globals.css)

- Warna: `canvas #f5f5f3`, `surface #fff`, `surface-2 #eeedea`, `line #e6e4e0`, `line-strong #d2cfc9`, `field-line #928e87`, `ink #1c1b19`, `ink-2 #55514b`, `ink-3 #6f6a63`, aksen `clay #c2410c` (tombol utama dan uang keluar), `teal #0e7490` (uang masuk), status `good`, `warn #9a4a07`, `bad`.
- Radius: `xl 20`, `lg 16`, `md 12`, `sm 8`. Bayangan hanya `--shadow-pop` untuk lembar dan dialog; kartu memakai garis tipis tanpa bayangan.
- Tipografi: judul halaman 28px, judul bagian 17px semibold, isi 15–16px, keterangan 13–14px. Label tidak lagi huruf kapital semua.
- Animasi: hanya `page-enter` (150ms), lembar/dialog muncul, toast, dan semuanya dimatikan bila pengguna memilih kurangi gerakan.

### 8.3 Kelas dan komponen baru atau berubah

| Nama | Letak | Dipakai untuk |
|---|---|---|
| `.btn`, `.btn-sm`, `.btn-primary/secondary/ghost/danger/danger-solid` | globals.css | Tombol 48px (kecil 44px). Satu tombol utama per layar. |
| `.icon-btn`, `.icon-btn-danger` | globals.css | Tombol ikon 44×44 (hapus baris, keluar) |
| `.field`, `.field-label`, `.form-section`, `.text-help`, `.link` | globals.css | Form yang seragam |
| `.segment`, `.segment-item` | globals.css | Pilihan tab; status aktif dibaca dari `aria-current="page"` atau `aria-pressed="true"` |
| `PageHeader` | components/page-header.tsx | Judul halaman. `backMobileOnly` menyembunyikan tombol kembali di desktop. |
| `SectionTitle`, `SeeAll` | components/ui.tsx | Judul bagian (h2) dan tautan "Lihat semua" |
| `Hero` | components/ui.tsx | Satu angka terpenting di layar (laba, total piutang, nilai stok) |
| `FlowPair`, `FlowChip` | components/ui.tsx | Pasangan uang masuk/keluar; penanda arah uang yang juga terbaca pembaca layar |
| `StatGroup` | components/ui.tsx | Dua sampai tiga angka dalam satu kartu bersekat, bisa berupa tautan |
| `DetailList` | components/ui.tsx | Pasangan label dan nilai di halaman detail |
| `Disclosure` | components/ui.tsx | Form yang jarang dipakai (tambah aset, tambah staf); terbuka otomatis bila daftar kosong |
| `EmptyState`, `Callout`, `Badge`, `List`, `Row` | components/ui.tsx | Status kosong, catatan, label status, daftar |
| `ConfirmDialog`, `Sheet`, `useModal` | components/dialog.tsx | Dialog konfirmasi dan lembar bawah dengan fokus terkurung, Escape, dan pengembalian fokus |
| `Segmented` | components/segmented.tsx | Tab tautan; prop `label` wajib diisi untuk pembaca layar |

Dihapus: `CoverHeader`, `BalanceCard`, `Stat` dari ui.tsx, dan berkas `src/components/effects.tsx` (Reveal, CountUp).

### 8.4 Cara memakai konfirmasi

`ActionButton` kini menerima `confirm` berupa objek, bukan teks:

```tsx
<ActionButton
  action={deleteAsset}
  hidden={{ id: a.id }}
  confirm={{ title: `Hapus aset ${a.name}?`, body: "Aset ini akan hilang dari daftar.", confirmLabel: "Hapus", danger: true }}
  className="icon-btn icon-btn-danger"
  ariaLabel={`Hapus aset ${a.name}`}
>
  <IconTrash />
</ActionButton>
```

Judul berupa pertanyaan yang menyebut objeknya, isi menjelaskan akibatnya, tombol memakai kata kerja. Bila `danger`, fokus awal ada di "Batal" agar Enter tidak langsung menghapus.

### 8.5 Perubahan di luar tampilan

- `src/lib/receivables.ts`: tipe `Receivable` mendapat kolom `customerId` agar tombol "Tambah Nomor HP" bisa menuju form pelanggan. Hanya dibaca untuk tampilan; perhitungan piutang tidak berubah.
- `src/lib/actions/workshop.ts`, `src/lib/actions/products.ts`, `src/lib/upload.ts`: hanya teks pesan ("owner" menjadi "pemilik", "Owner perlu" menjadi "Pengelola aplikasi perlu").
- Di halaman Keuangan, tombol utama mengikuti tab yang aktif (tab Keluar menonjolkan "Uang Keluar").

### 8.6 Istilah yang dipakai di seluruh aplikasi

Uang masuk / uang keluar (bukan pemasukan/pengeluaran di tombol), Belum lunas, Pemilik dan Staf (bukan owner/admin), Catat (aksi utama), Barang (untuk baris item), Tempat pesan, Bayar pakai.

### 8.7 Yang sengaja tidak disentuh

- Blok di `AGENTS.md` (dibuat ulang oleh `next dev`).
- Skema Prisma, rumus keuangan, dan `.env`.
- Isi PDF laporan (`src/lib/reports-pdf.ts`) masih memakai kata "Piutang". Sesuai batasan rencana, PDF tidak diubah.

### 8.8 Pemeriksaan ulang dan perapian (15 November 2026)

Semua layar dibuka lagi di aplikasi yang berjalan (HP 390 px dan desktop 1280 px, sebagai pemilik dan staf, 78 tangkapan layar). Semua item di bagian 6 memang sudah terpasang di kode. Yang ditemukan dan diperbaiki:

| Temuan | Perbaikan | Berkas |
|---|---|---|
| Detail pesanan dan penjualan punya dua tombol utama (tahap berikutnya dan "Kirim" invoice) | "Kirim"/"Buka Invoice" jadi tombol sekunder | `invoice-actions.tsx` |
| "Batalkan Pesanan" berada di tengah, di atas tombol invoice | Dipindah ke paling bawah, sesuai 3.4 | `orders/[id]/page.tsx` |
| Teks tombol "Lanjut ke Diproses" janggal | "Tandai Dikonfirmasi / Diproses / Siap" | `orders/[id]/page.tsx` |
| "Tenggat" dan "jatuh tempo" dipakai bergantian | Seragam "Jatuh tempo" | `orders/*`, `order-form.tsx` |
| Ikon di tombol gepeng saat teks tombol panjang (mis. "Kirim Pengingat") | `.btn svg { flex-shrink: 0 }` | `globals.css` |
| Di Belum Lunas tiap kartu punya tombol utama oranye | "Kirim Pengingat" jadi tombol sekunder | `receivables/page.tsx` |
| Di HP, judul baris Penjualan/Pesanan/Riwayat pembelian terpotong ("5× Vas Bu…") karena badge di samping angka | `Row` mendapat prop `status`: badge pindah ke bawah keterangan; tanggal jatuh tempo pesanan ditaruh di samping badge | `ui.tsx`, `sales/page.tsx`, `orders/page.tsx`, `customers/[id]/page.tsx`, `dashboard/due-soon.tsx` |
| Produk stok 0 berlabel "menipis" | Badge merah "Habis"; "Menipis" untuk stok rendah | `dashboard/page.tsx`, `products/page.tsx` |
| Istilah Inggris "gift" di Workshop | "Suvenir" (tampilan saja; nama kolom database tetap) | `workshop-form.tsx`, `workshop/[id]/page.tsx`, `lib/actions/workshop.ts` |
| "metode bayar" / "metode pembayaran" | "cara bayar", sesuai kamus "Bayar pakai" | `settings/page.tsx`, `onboarding/page.tsx` |
| Catatan di form Catat Uang dibaca setelah tombol Simpan, dan memakai kata "berhutang/piutang" | Dipindah ke atas tombol Simpan, kalimat memakai "Belum Lunas" | `finance/new/page.tsx` |
| Tombol "Arsipkan Produk" memakai ikon tempat sampah padahal tidak menghapus | Ikon hanya untuk "Hapus Produk" | `products/[id]/page.tsx` |
| Sisa: `effects.tsx` dan `IconSpark` tidak dipakai | Dihapus | `components/` |
| `package-lock.json` tidak sinkron | Disinkronkan dengan `npm install`; `npm ci` dari folder bersih kini berhasil | `package-lock.json` |

Keyboard dicek ulang: Tab pertama ke "Lewati ke isi"; lembar Catat memfokuskan pilihan pertama, Tab tetap di dalam lembar, Escape menutup; dialog batalkan pesanan membuka dengan fokus di "Jangan".

Catatan untuk typecheck: `tsc --noEmit` butuh tipe rute dari Next (`PageProps`, `LayoutProps`). Skrip `npm run typecheck` kini menjalankan `next typegen` dulu, jadi `npm run check` langsung jalan di folder baru.

### 8.9 Logo dan nama Gerabara (15 November 2026)

Aplikasi berganti nama dari GERABAH menjadi **Gerabara**, mengikuti tulisan di logo. Kata "gerabah" sebagai nama barang (misalnya "perajin gerabah") tetap.

| Hal | Isi | Lokasi |
|---|---|---|
| Nama aplikasi | Satu sumber: `APP_NAME` dan `APP_TAGLINE`. Judul tab, manifest, PDF, dan email reset membaca dari sini. Teks WhatsApp ke admin ditulis langsung di `help/page.tsx` dan `forgot-password-help.tsx` | `src/lib/brand.ts` |
| Berkas logo | `gerabara-mark.svg` (guci, koin, mega mendung), `gerabara-pot.svg` (guci polos), `gerabara-mark-1024.png` (sumber ikon) | `public/brand/` |
| Komponen logo | `<Logo size tone tile wordmark />`, dengan `tone` berisi `ink` atau `white`. `tile` menaruh tanda di ubin krem untuk latar foto | `src/components/logo.tsx` |
| Huruf logo | Urbanist tebal (700), huruf kecil, hanya untuk tulisan "gerabara". Teks lain tetap Plus Jakarta Sans | `layout.tsx`, token `--font-brand` |
| Warna logo | `--color-brand-ink` `#2a1a0c`, `--color-brand-cream` `#fdf5ea` | `globals.css` |
| Ikon aplikasi | `icon-192`, `icon-512`, `icon-maskable-512`, `apple-icon`, `favicon.ico` dibuat ulang dari logo | `python scripts/make-icons.py` |
| Tempat logo tampil | Halaman depan (atas dan kaki), Masuk/Daftar, bilah samping desktop, kaki halaman Menu, halaman galat dan 404 | — |

Sengaja tidak diubah: nama cookie `gerabah_session` dan `gerabah_flash` (kalau diganti, semua pengguna keluar sendiri), nama paket di `package.json`, dan warna manifest.

Logo vektor adalah hasil jiplak dari gambar 1536 px. Bila ada berkas asli (SVG atau PNG besar), ganti isi `public/brand/` lalu jalankan ulang `scripts/make-icons.py`.

### 8.10 Tanah Liat Hangat (15 November 2026)

Arah visual A dari brainstorm "terlalu polos" diterapkan ke aplikasi, lengkap dengan perapian untuk HP. Maketnya (8 layar) ada di kanvas desain proyek; kode mengikuti maket itu.

| Hal | Isi | Lokasi |
|---|---|---|
| Warna dasar | Kanvas krem `#f7f1e8`, kartu `#fffdf9`, garis `#e7dccb`, teks `#2a1f17` / `#5c4f44` / `#6e6155`, batas isian dan tombol `#857a6b` (4,1:1) | `globals.css` `@theme` |
| Kotak Hero | Satu per halaman, cokelat `#7a2e0e` dengan siluet kendi. Isi tambahan wajib lewat `HeroNote`, `FlowPair`, `HeroLink`, atau `HeroPanel` (kotak putih) supaya tetap terbaca. `Hero` tidak lagi menerima warna angka (selalu putih) | `ui.tsx` |
| Ubin penanda | `Tile`: tanah liat = jualan, teal = uang, oker = barang, daun = orang, batu = aplikasi. Dipakai di Menu (`tone` pada `nav-items.ts`), daftar penjualan, `FlowChip`, `StatGroup` | `ui.tsx`, `nav-items.ts` |
| Status | `Badge` selalu ikon + tulisan. `PaymentBadge` dan `OrderBadge` mengisi ikon per status (Lunas, Belum Lunas, Dibayar Sebagian; Baru, Dikonfirmasi, Diproses, Siap Diambil, Selesai). Belum Lunas kini nada `clay`, bukan merah | `status-badge.tsx`, `labels.ts` |
| StatGroup | Bila item punya `icon`, tampil sebagai daftar baris berubin dengan panah (Beranda). Tanpa `icon`, tetap kartu berkolom | `ui.tsx` |
| Row | Judul boleh 2 baris, angka bisa dipindah ke baris bawah (`stackAmount`) agar judul panjang muat di HP | `ui.tsx` |
| Menu bawah | Penanda berbentuk pil di balik ikon aktif, huruf 13 px, tombol "Catat" berlabel. Tinggi 76 px (+ area aman) | `nav.tsx`, `.h-tabbar` |
| Layar baru/berubah | Penjualan (kelompok per tanggal), Pesanan (kartu: tahap, jatuh tempo, total, sisa), Belum Lunas (Hero, catatan WhatsApp, tombol 48 px), Produk (foto 72 px), grafik batang (`#0b5a70` / `#d9622b`) | `sales`, `orders`, `receivables`, `products`, `cashflow-chart.tsx` |
| Ukuran untuk HP | Isi 17 px, keterangan 15 px, tombol 52 px (kecil 44 px), isian 52 px, segmen 44 px, sasaran sentuh ≥ 44 px, toast naik di atas menu bawah, warna bilah alamat dan manifest `#f7f1e8` | `globals.css`, `toaster.tsx`, `layout.tsx`, `manifest.ts` |

Belum dikerjakan: pengaturan "Ukuran huruf: Biasa/Besar" (ukuran masih px, bukan rem), foto produk besar di halaman detail untuk produk tanpa foto, dan pemeriksaan visual di HP sungguhan.
