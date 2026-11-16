import writeXlsxFile from "write-excel-file/node";
import { toISODate } from "./date-range";

export type XlsxColumn<T> = {
  header: string;
  width?: number;
  get: (row: T) => string | number | Date | null | undefined;
};

/** Bangun file Excel (.xlsx) asli dari baris data — pengganti CSV lama. */
export async function buildXlsxBuffer<T>(rows: T[], columns: XlsxColumn<T>[]): Promise<Buffer> {
  const cols = columns.map((c) => ({
    header: c.header,
    width: c.width ?? 18,
    cell: (row: T) => {
      const v = c.get(row);
      if (v == null || v === "") return { value: "" };
      // Excel tidak kenal zona waktu: geser ke kalender WIB supaya tanggalnya sama dengan di aplikasi.
      if (v instanceof Date) return { value: new Date(`${toISODate(v)}T00:00:00Z`), type: Date, format: "dd/mm/yyyy" };
      if (typeof v === "number") return { value: v, type: Number, format: "#,##0" };
      return { value: String(v), type: String };
    },
  }));

  const result = writeXlsxFile(rows, { columns: cols });
  return result.toBuffer();
}
