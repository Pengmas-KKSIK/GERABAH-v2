"use client";

import { useEffect, useRef, useState } from "react";
import { IconCamera } from "./icons";

const MAX_MB = 20; // sama dengan MAX_UPLOAD_MB di lib/upload.ts

/**
 * Pilih foto/video produk dari galeri atau kamera, dengan pratinjau.
 * "Hapus foto" pada foto yang sudah tersimpan mengirim removePhoto=1 supaya server menghapusnya.
 */
export function PhotoInput({ name = "photo", current }: { name?: string; current?: string | null }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  // lepaskan URL pratinjau lokal supaya memori HP tidak menumpuk
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clear = () => {
    if (ref.current) ref.current.value = "";
    setPreview(null);
    setRemoved(Boolean(current));
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        aria-label={preview ? "Ganti foto produk" : "Tambah foto produk"}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-field-line bg-surface-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Pratinjau foto produk" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-2">
            <IconCamera className="h-7 w-7" strokeWidth={1.6} />
            <span className="text-[15px] font-medium">Tambah foto produk</span>
          </span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && f.size > MAX_MB * 1024 * 1024) {
            e.target.value = "";
            setError(`Ukuran file maksimal ${MAX_MB}MB. Pilih file yang lebih kecil.`);
            return;
          }
          setError(null);
          if (f) {
            setPreview(URL.createObjectURL(f));
            setRemoved(false);
          }
        }}
      />
      {removed && <input type="hidden" name="removePhoto" value="1" />}
      {error && <p role="alert" className="mt-1.5 text-[14px] font-medium text-bad">{error}</p>}
      {preview && (
        <button type="button" onClick={clear} className="mt-1 min-h-[44px] text-[15px] font-semibold text-bad">
          Hapus foto
        </button>
      )}
    </div>
  );
}
