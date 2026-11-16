import { headers } from "next/headers";
import { UserError } from "@/lib/action-state";

/**
 * Pembatas percobaan sederhana di memori proses — cukup untuk satu server (VPS + PM2 satu
 * proses) dan menahan tebak-tebakan kata sandi. Di Vercel tiap instance punya hitungan sendiri,
 * jadi perlindungannya lebih lemah tapi tetap membantu.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Lempar UserError kalau `key` sudah melewati `limit` percobaan dalam `windowMs`. */
export async function rateLimit(scope: string, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const id = `${scope}:${await clientIp()}:${key}`;
  const b = buckets.get(id);
  if (!b || b.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) {
    const minutes = Math.ceil((b.resetAt - now) / 60000);
    throw new UserError(`Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`);
  }
}
