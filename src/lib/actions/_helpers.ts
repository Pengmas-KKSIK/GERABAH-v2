/**
 * Kumpulan helper untuk server action. Bukan file "use server" — tidak ada yang bisa
 * dipanggil langsung dari browser. Logika murni ada di form-parse.ts & domain/*.
 */
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export { type FormState, OK, UserError, run } from "@/lib/action-state";
export { requireBusiness, requireOwner, requireContext } from "@/lib/guards";
export * from "@/lib/form-parse";

type LookupModel = {
  findFirst: (a: { where: { businessId: string; name: string } }) => Promise<{ id: string } | null>;
  create: (a: { data: { businessId: string; name: string } }) => Promise<{ id: string }>;
};

/** Cari pilihan (kategori, metode bayar, …) berdasarkan nama; buat baru kalau belum ada. */
async function findOrCreate(model: LookupModel, businessId: string, name: string) {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return null;
  const existing = await model.findFirst({ where: { businessId, name: trimmed } });
  if (existing) return existing.id;
  try {
    return (await model.create({ data: { businessId, name: trimmed } })).id;
  } catch {
    // Dibuat bersamaan oleh permintaan lain (nama unik per usaha) — ambil yang sudah ada.
    const again = await model.findFirst({ where: { businessId, name: trimmed } });
    if (again) return again.id;
    throw new Error(`Gagal menyimpan pilihan "${trimmed}".`);
  }
}

export const findOrCreatePaymentMethod = (b: string, n: string) => findOrCreate(prisma.paymentMethod, b, n);
export const findOrCreateIncomeCategory = (b: string, n: string) => findOrCreate(prisma.incomeCategory, b, n);
export const findOrCreateExpenseCategory = (b: string, n: string) => findOrCreate(prisma.expenseCategory, b, n);
export const findOrCreateProductCategory = (b: string, n: string) => findOrCreate(prisma.productCategory, b, n);
export const findOrCreateChannel = (b: string, n: string) => findOrCreate(prisma.salesChannel, b, n);
export const findOrCreateProductOtherCostCategory = (b: string, n: string) =>
  findOrCreate(prisma.productOtherCostCategory, b, n);
export const findOrCreateFixedCostCategory = (b: string, n: string) => findOrCreate(prisma.fixedCostCategory, b, n);

/** Kategori pemasukan "Penjualan" — dipakai semua uang masuk dari penjualan/pesanan. */
export async function salesIncomeCategoryId(businessId: string) {
  return (await findOrCreateIncomeCategory(businessId, "Penjualan"))!;
}

/** Pastikan pelanggan yang dipilih memang milik usaha ini (bukan id dari usaha lain). */
export async function ownCustomerId(businessId: string, customerId: string): Promise<string | null> {
  if (!customerId) return null;
  const c = await prisma.customer.findFirst({ where: { id: customerId, businessId }, select: { id: true } });
  return c?.id ?? null;
}

/**
 * Catat aktivitas pengguna (untuk log perubahan yang dilihat owner).
 * Tidak pernah melempar error — kegagalan log tidak boleh membatalkan aksi utama.
 */
export async function logActivity(businessId: string, action: string, summary: string) {
  try {
    const session = await getSession();
    if (!session) return;
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true },
    });
    await prisma.activityLog.create({
      data: {
        businessId,
        userId: session.userId,
        userName: user?.name ?? "?",
        role: user?.role ?? "owner",
        action,
        summary,
      },
    });
  } catch (e) {
    console.error("[activity]", e);
  }
}
