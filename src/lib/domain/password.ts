/**
 * Aturan kata sandi baru — murni, tanpa database, diuji di password.test.ts.
 * Dipakai saat pengguna mengganti kata sandinya sendiri dan saat pemilik mengatur ulang kata sandi staf.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72; // batas bcrypt

/** Kembalikan pesan kesalahan untuk pengguna, atau null kalau kata sandi baru boleh dipakai. */
export function newPasswordError(password: string, confirm: string, current?: string): string | null {
  if (password.length < PASSWORD_MIN) return `Kata sandi minimal ${PASSWORD_MIN} karakter.`;
  if (password.length > PASSWORD_MAX) return `Kata sandi maksimal ${PASSWORD_MAX} karakter.`;
  if (!confirm) return "Ulangi kata sandinya.";
  if (password !== confirm) return "Konfirmasi kata sandi tidak sama.";
  if (current !== undefined && password === current) return "Kata sandi baru tidak boleh sama dengan yang lama.";
  return null;
}
