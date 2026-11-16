import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UserError } from "@/lib/action-state";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const BUCKET = "uploads";

// URL project Supabase (bisa ditimpa lewat env). Ref project ada di DEPLOY.md.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://sndvjvtfdsgbgedrevic.supabase.co";

export const MAX_UPLOAD_MB = 20;

/** Jenis file yang diterima → ekstensi yang dipakai (ekstensi dari nama file asli tidak dipercaya). */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/**
 * Simpan foto/video produk dan kembalikan URL publiknya (null kalau tidak ada file).
 * - Ada SUPABASE_SERVICE_ROLE_KEY → Supabase Storage bucket "uploads" (wajib di produksi,
 *   supaya foto ikut tersimpan & ter-backup bersama data, bukan di disk server).
 * - Mode dev tanpa key → public/uploads/ di disk lokal.
 */
export async function saveUploadedFile(file: File | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;

  const ext = EXTENSIONS[file.type];
  if (!ext) throw new UserError("Format file tidak didukung. Gunakan JPG, PNG, WEBP, GIF, MP4, WEBM, atau MOV.");
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new UserError(`Ukuran file maksimal ${MAX_UPLOAD_MB}MB.`);

  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        // Supabase Storage butuh apikey juga (baik key lama service_role maupun baru sb_secret_).
        apikey: serviceKey,
        "Content-Type": file.type,
        "x-upsert": "true",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      console.error("[upload] Supabase Storage gagal", res.status, await res.text().catch(() => ""));
      if (res.status === 404) throw new UserError(`Bucket "${BUCKET}" belum dibuat di Supabase Storage.`);
      if (res.status === 401 || res.status === 403) {
        throw new UserError("Kunci Supabase (SUPABASE_SERVICE_ROLE_KEY) salah atau tidak berlaku.");
      }
      throw new UserError(`Gagal mengunggah foto (kode ${res.status}). Coba lagi.`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new UserError(
      "Upload foto belum aktif. Pengelola aplikasi perlu mengatur SUPABASE_SERVICE_ROLE_KEY di server. " +
        "Untuk sekarang, simpan produk tanpa foto dulu."
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
