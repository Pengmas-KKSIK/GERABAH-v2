/**
 * Hasil server action yang dibaca form (lihat components/form.tsx & action-button.tsx).
 * File ini sengaja tanpa import server, supaya tipenya aman dipakai komponen client.
 */
export type FormState = { error?: string; ok?: boolean; message?: string };
export const OK: FormState = { ok: true };

/**
 * Kesalahan yang pesannya boleh ditampilkan ke pengguna (validasi, data tidak ditemukan, dst.).
 * Kesalahan lain (database, jaringan, bug) diganti pesan umum supaya detail teknis tidak bocor.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

const GENERIC_ERROR = "Terjadi kesalahan. Coba lagi sebentar lagi.";

function friendlyMessage(e: unknown): string {
  if (e instanceof UserError) return e.message;
  // Pelanggaran unik Prisma (mis. dua permintaan bersamaan membuat data yang sama).
  if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "P2002") {
    return "Data ini sudah ada. Muat ulang halaman lalu coba lagi.";
  }
  return GENERIC_ERROR;
}

/** Jalankan isi mutasi; kesalahan diubah jadi pesan di form, bukan halaman error. */
export async function run(fn: () => Promise<void>): Promise<FormState> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (!(e instanceof UserError)) console.error("[action]", e);
    return { error: friendlyMessage(e) };
  }
}
