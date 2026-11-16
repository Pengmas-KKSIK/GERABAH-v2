/** Baca `?q=` dari searchParams halaman. */
export function queryParam(q: string | string[] | undefined) {
  const v = (Array.isArray(q) ? q[0] : q)?.trim();
  return v ? v.slice(0, 100) : undefined;
}

/** Cocokkan teks pencarian tanpa peduli huruf besar/kecil. */
export function matchesQuery(q: string | undefined, ...fields: (string | null | undefined)[]) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(needle));
}
