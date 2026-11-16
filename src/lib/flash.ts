import { cookies } from "next/headers";

/** Nama cookie pesan sekali-tampil; dibaca & dihapus oleh components/toaster.tsx. */
export const FLASH_COOKIE = "gerabah_flash";

/**
 * Simpan pesan singkat ("Tersimpan", "Dihapus", …) yang muncul sebagai notifikasi
 * di halaman berikutnya. Panggil tepat sebelum `redirect()` di Server Action.
 */
export async function flash(message: string) {
  // Next.js sudah meng-encode nilai cookie sendiri — jangan di-encode lagi (jadi "%2520").
  (await cookies()).set(FLASH_COOKIE, message.slice(0, 120), {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false, // harus bisa dibaca & dihapus oleh browser
  });
}
