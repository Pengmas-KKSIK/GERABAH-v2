import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/current-user";
import { createBusiness } from "@/lib/actions/business";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { Callout } from "@/components/ui";

export default async function OnboardingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login"); // belum login, atau akunnya sudah dihapus
  if (ctx.business || ctx.user.memberOfBusinessId) redirect("/dashboard");

  return (
    <AuthShell image="/images/hands.webp" title="Daftarkan Usahamu" subtitle="Sedikit keterangan sebelum mulai mencatat.">
      <ActionForm
        action={createBusiness}
        footer={<SubmitButton pendingLabel="Menyiapkan…">Mulai Mencatat</SubmitButton>}
      >
        <label className="block">
          <span className="field-label">Nama usaha</span>
          <input name="name" required autoFocus maxLength={120} className="field" placeholder="mis. Gerabah Bu Siti" />
        </label>
        <label className="block">
          <span className="field-label">Lokasi (opsional)</span>
          <input name="location" maxLength={200} className="field" placeholder="Desa / Kecamatan / Kabupaten" />
        </label>
        <label className="block">
          <span className="field-label">Keterangan singkat (opsional)</span>
          <textarea name="description" rows={2} maxLength={500} className="field" placeholder="Apa saja yang dibuat dan dijual" />
        </label>
        <Callout>
          Kategori, tempat jualan, dan cara bayar yang umum akan otomatis disiapkan, dan bisa kamu ubah kapan saja.
        </Callout>
      </ActionForm>
    </AuthShell>
  );
}
