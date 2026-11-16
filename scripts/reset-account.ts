import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { wipeBusinessData } from "../src/lib/wipe-business";

/**
 * Hapus semua data SATU akun (berdasarkan email). User login-nya ikut terhapus.
 * Kalau akun ini owner, akun staf di usahanya juga ikut terhapus (relasi cascade).
 * Jalankan: npx tsx scripts/reset-account.ts email@contoh.com
 */
async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) {
    console.error("Pakai: npx tsx scripts/reset-account.ts <email>");
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { businesses: { include: { staff: true } } } });
    if (!user) {
      console.error(`User ${email} tidak ditemukan.`);
      process.exit(1);
    }
    const bizIds = user.businesses.map((b) => b.id);
    const staff = user.businesses.flatMap((b) => b.staff.map((s) => s.email));

    if (bizIds.length) await wipeBusinessData(prisma, bizIds);
    await prisma.business.deleteMany({ where: { id: { in: bizIds } } }); // staf ikut terhapus (cascade)
    await prisma.user.delete({ where: { id: user.id } });

    console.log(`✓ Akun ${email} beserta semua datanya dihapus.`);
    if (staff.length) console.log(`  Akun staf yang ikut terhapus: ${staff.join(", ")}`);
  } finally {
    await prisma.$disconnect();
  }
}
main();
