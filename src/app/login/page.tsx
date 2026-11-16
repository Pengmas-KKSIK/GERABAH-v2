import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/current-user";
import { login } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { ActionForm, SubmitButton } from "@/components/form";
import { PasswordField } from "@/components/password-field";

export default async function LoginPage() {
  if (await getSessionContext()) redirect("/dashboard");

  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjutkan mencatat keuangan usahamu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/signup" className="link">
            Buat akun
          </Link>
        </>
      }
    >
      <ActionForm action={login} footer={<SubmitButton pendingLabel="Masuk…">Masuk</SubmitButton>}>
        <label className="block">
          <span className="field-label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" placeholder="nama@gmail.com" />
        </label>
        <div>
          <PasswordField name="password" label="Kata sandi" autoComplete="current-password" />
          <Link href="/forgot-password" className="link mt-1 inline-flex min-h-[44px] items-center text-[15px]">
            Lupa kata sandi?
          </Link>
        </div>
      </ActionForm>
    </AuthShell>
  );
}
