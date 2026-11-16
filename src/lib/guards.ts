import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/current-user";

/**
 * Penjaga akses untuk halaman & server action. Setiap action WAJIB memanggil salah satunya —
 * menyembunyikan tombol di tampilan bukan pengaman, karena action bisa dipanggil langsung.
 */

/** User yang login + usahanya. Belum login → /login, belum punya usaha → /onboarding. */
export async function requireContext() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.business) redirect("/onboarding");
  return { ...ctx, business: ctx.business };
}

export async function requireBusiness() {
  return (await requireContext()).business;
}

/** Seperti requireBusiness, tapi staf ditolak (dikembalikan ke Beranda). */
export async function requireOwner() {
  const ctx = await requireContext();
  if (ctx.role !== "owner") redirect("/dashboard");
  return ctx.business;
}
