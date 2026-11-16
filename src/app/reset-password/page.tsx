import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RESET_TTL_MINUTES, verifyResetToken } from "@/lib/password-reset";
import { resetPassword } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { PasswordField } from "@/components/password-field";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const valid = token
    ? Boolean(await verifyResetToken(token, (id) => prisma.user.findUnique({ where: { id } })))
    : false;

  return (
    <AuthShell
      title="Kata Sandi Baru"
      subtitle={valid ? "Buat kata sandi baru untuk akunmu." : "Link ini sudah tidak berlaku."}
      footer={
        <>
          Ingat kata sandinya?{" "}
          <Link href="/login" className="link">
            Masuk
          </Link>
        </>
      }
    >
      {valid ? (
        <ActionForm
          action={resetPassword}
          hidden={{ token }}
          footer={<SubmitButton pendingLabel="Menyimpan…">Simpan & Masuk</SubmitButton>}
        >
          <PasswordField
            name="password"
            label="Kata sandi baru"
            autoComplete="new-password"
            minLength={8}
            placeholder="Minimal 8 karakter"
            autoFocus
            showHint
          />
          <PasswordField name="confirmPassword" label="Ulangi kata sandi baru" autoComplete="new-password" minLength={8} />
        </ActionForm>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-help">
            Link atur ulang hanya berlaku {RESET_TTL_MINUTES} menit dan hanya bisa dipakai sekali. Minta link baru, lalu buka link
            terbaru di email kamu.
          </p>
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Minta Link Baru
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
