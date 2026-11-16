import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/current-user";
import { ADMIN_WHATSAPP } from "@/lib/config";
import { emailResetEnabled } from "@/lib/password-reset";
import { requestPasswordReset } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { ForgotPasswordHelp } from "@/components/forgot-password-help";

export default async function ForgotPasswordPage() {
  if (await getSessionContext()) redirect("/dashboard");
  const viaEmail = emailResetEnabled();

  return (
    <AuthShell
      title="Lupa Kata Sandi"
      subtitle={viaEmail ? "Kami kirim link atur ulang ke emailmu." : "Minta admin mengatur ulang kata sandimu."}
      footer={
        <>
          Ingat kata sandinya?{" "}
          <Link href="/login" className="link">
            Masuk
          </Link>
        </>
      }
    >
      {viaEmail ? (
        <div className="flex flex-col gap-6">
          <ActionForm
            action={requestPasswordReset}
            footer={<SubmitButton pendingLabel="Mengirim…">Kirim Link Atur Ulang</SubmitButton>}
          >
            <label className="block">
              <span className="field-label">Email akunmu</span>
              <input name="email" type="email" required autoComplete="email" className="field" placeholder="nama@gmail.com" />
            </label>
          </ActionForm>

          <div className="border-t border-line pt-5">
            <ForgotPasswordHelp
              adminWhatsapp={ADMIN_WHATSAPP}
              intro="Tidak menerima email atau lupa email akunmu? Hubungi admin lewat WhatsApp."
            />
          </div>
        </div>
      ) : (
        <ForgotPasswordHelp adminWhatsapp={ADMIN_WHATSAPP} />
      )}
    </AuthShell>
  );
}
