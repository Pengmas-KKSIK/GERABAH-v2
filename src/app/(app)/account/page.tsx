import { requireContext } from "@/lib/guards";
import { changeOwnPassword } from "@/lib/actions/account";
import { PageHeader } from "@/components/page-header";
import { PasswordField } from "@/components/password-field";
import { ActionForm, SubmitButton } from "@/components/form";
import { Card, Callout, DetailList, SectionTitle } from "@/components/ui";

export default async function AccountPage() {
  const { user, business, role } = await requireContext();
  const isStaff = role === "staff";

  return (
    <>
      <PageHeader title="Akun Saya" subtitle="Data akun dan kata sandi" back="/more" backLabel="Menu" backMobileOnly />

      <DetailList
        rows={[
          ["Nama", user.name],
          ["Email", user.email],
          ["Usaha", business.name],
          ["Peran", isStaff ? "Staf" : "Pemilik"],
        ]}
      />

      <SectionTitle>Ganti kata sandi</SectionTitle>
      <ActionForm action={changeOwnPassword} footer={<SubmitButton>Simpan Kata Sandi</SubmitButton>}>
        <Card>
          <div className="flex flex-col gap-4">
            <PasswordField name="currentPassword" label="Kata sandi sekarang" autoComplete="current-password" />
            <PasswordField name="password" label="Kata sandi baru" autoComplete="new-password" minLength={8} showHint />
            <PasswordField name="confirmPassword" label="Ulangi kata sandi baru" autoComplete="new-password" minLength={8} />
          </div>
        </Card>
        <Callout>
          {isStaff
            ? "Lupa kata sandi yang sekarang? Minta pemilik usaha mengatur ulang lewat Pengaturan → Staf."
            : "Lupa kata sandi yang sekarang? Keluar dulu, lalu pakai Lupa kata sandi di halaman Masuk."}
        </Callout>
      </ActionForm>
    </>
  );
}
