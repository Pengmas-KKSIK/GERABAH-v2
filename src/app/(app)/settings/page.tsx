import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { requireOwner } from "@/lib/guards";
import { updateBusiness } from "@/lib/actions/business";
import { addStaff, removeStaff, resetStaffPassword } from "@/lib/actions/staff";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { PasswordField } from "@/components/password-field";
import { PageHeader } from "@/components/page-header";
import { Card, List, Row, SectionTitle, Disclosure, DetailList, Avatar } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { LogoutButton } from "@/components/logout-button";
import { IconTrash, IconPlus, IconLock, IconChevronRight } from "@/components/icons";

export default async function SettingsPage() {
  const business = await requireOwner();
  const user = await getCurrentUser();

  const [prodCat, channels, methods, staff] = await Promise.all([
    prisma.productCategory.count({ where: { businessId: business.id } }),
    prisma.salesChannel.count({ where: { businessId: business.id } }),
    prisma.paymentMethod.count({ where: { businessId: business.id } }),
    prisma.user.findMany({
      where: { memberOfBusinessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Pengaturan" back="/more" backLabel="Menu" backMobileOnly />

      <SectionTitle className="!mt-0">Data usaha</SectionTitle>
      <ActionForm action={updateBusiness} footer={<SubmitButton>Simpan Perubahan</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="field-label">Nama usaha</span>
              <input name="name" required defaultValue={business.name} className="field" />
            </label>
            <label className="block">
              <span className="field-label">Lokasi</span>
              <input name="location" defaultValue={business.location ?? ""} className="field" />
            </label>
            <label className="block">
              <span className="field-label">Keterangan</span>
              <textarea name="description" rows={2} defaultValue={business.description ?? ""} className="field" />
            </label>
          </div>
        </Card>
      </ActionForm>

      {/* ── Pengguna / Staf ── */}
      <SectionTitle>Staf</SectionTitle>
      <p className="text-help mb-3">
        Pemilik melihat semua laporan, keuntungan, dan pengaturan. Staf hanya bisa mencatat penjualan, pesanan,
        pengeluaran, dan pelanggan.
      </p>

      {staff.length > 0 && (
        <List className="mb-3">
          {staff.map((s) => (
            <Row
              key={s.id}
              leading={<Avatar name={s.name} />}
              title={s.name}
              meta={s.email}
              chevron={false}
              trailing={
                <ActionButton
                  action={removeStaff}
                  hidden={{ id: s.id }}
                  className="icon-btn icon-btn-danger -mr-2"
                  ariaLabel={`Hapus akun staf ${s.name}`}
                  confirm={{
                    title: `Hapus akun staf ${s.name}?`,
                    body: "Akun ini tidak bisa masuk lagi.",
                    confirmLabel: "Hapus Akun",
                    danger: true,
                  }}
                  pendingLabel="…"
                >
                  <IconTrash className="h-[18px] w-[18px]" strokeWidth={2} />
                </ActionButton>
              }
            />
          ))}
        </List>
      )}

      <Disclosure title="Tambah staf" icon={<IconPlus className="h-5 w-5" strokeWidth={2.2} />} defaultOpen={staff.length === 0}>
      <ActionForm action={addStaff} footer={<SubmitButton>Simpan Staf</SubmitButton>}>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="field-label">Nama staf</span>
              <input name="name" required className="field" placeholder="Nama lengkap" />
            </label>
            <label className="block">
              <span className="field-label">Email staf</span>
              <input name="email" type="email" required className="field" placeholder="nama@gmail.com" />
            </label>
            <PasswordField name="password" label="Kata sandi awal" autoComplete="new-password" minLength={8} showHint />
            <PasswordField
              name="confirmPassword"
              label="Ulangi kata sandi"
              autoComplete="new-password"
              minLength={8}
            />
          </div>
      </ActionForm>
      </Disclosure>

      {staff.length > 0 && (
        <div className="mt-3">
          <Disclosure title="Atur ulang kata sandi staf" icon={<IconLock className="h-5 w-5" strokeWidth={2} />}>
            <ActionForm action={resetStaffPassword} footer={<SubmitButton>Simpan Kata Sandi Baru</SubmitButton>}>
              <div className="flex flex-col gap-4">
                <p className="text-help">Staf lupa kata sandi? Buat kata sandi baru di sini, lalu beri tahu dia langsung.</p>
                <label className="block">
                  <span className="field-label">Staf</span>
                  <select name="id" required className="field" defaultValue="">
                    <option value="" disabled>
                      Pilih staf
                    </option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </label>
                <PasswordField name="password" label="Kata sandi baru" autoComplete="new-password" minLength={8} showHint />
                <PasswordField name="confirmPassword" label="Ulangi kata sandi baru" autoComplete="new-password" minLength={8} />
              </div>
            </ActionForm>
          </Disclosure>
        </div>
      )}

      <SectionTitle>Akun</SectionTitle>
      <DetailList
        rows={[
          ["Nama", user?.name ?? "—"],
          ["Email", user?.email ?? "—"],
          ["Data tersimpan", `${prodCat} kategori · ${channels} tempat jualan · ${methods} cara bayar`],
        ]}
      />

      <Link href="/account" className="btn btn-secondary mt-4 w-full">
        <IconLock className="h-[18px] w-[18px]" strokeWidth={2} />
        Ganti Kata Sandi Saya
        <IconChevronRight className="h-4 w-4" strokeWidth={2} />
      </Link>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </>
  );
}
