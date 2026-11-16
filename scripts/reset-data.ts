import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { wipeBusinessData } from "../src/lib/wipe-business";

/**
 * Kosongkan SEMUA data aplikasi (semua akun). Struktur tabel tetap.
 * Jalankan: npx tsx scripts/reset-data.ts
 */
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    await wipeBusinessData(prisma);
    await prisma.user.updateMany({ data: { memberOfBusinessId: null } });
    await prisma.business.deleteMany();
    await prisma.user.deleteMany();
    console.log("✓ Semua data dihapus. Database kosong.");
  } finally {
    await prisma.$disconnect();
  }
}
main();
