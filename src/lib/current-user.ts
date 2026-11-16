import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type Role = "owner" | "staff";

/**
 * User + usaha + peran untuk request ini (null kalau belum login atau akunnya sudah dihapus).
 * Dibungkus `cache` supaya layout, halaman, dan helper dalam satu render hanya query sekali.
 */
export const getSessionContext = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  const owned = await prisma.business.findFirst({ where: { ownerId: user.id } });
  if (owned) return { user, business: owned, role: "owner" as Role };

  if (user.memberOfBusinessId) {
    const business = await prisma.business.findUnique({ where: { id: user.memberOfBusinessId } });
    if (business) return { user, business, role: "staff" as Role };
  }
  return { user, business: null, role: "owner" as Role };
});

export async function getCurrentUser() {
  return (await getSessionContext())?.user ?? null;
}

/** Usaha milik user — sebagai owner, atau sebagai staf yang ditautkan. */
export async function getCurrentBusiness() {
  return (await getSessionContext())?.business ?? null;
}
