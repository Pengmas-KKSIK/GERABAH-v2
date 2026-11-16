import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { TabBar, Sidebar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.business) redirect("/onboarding");

  // Jumlah pengajuan harga yang menunggu — tampil sebagai angka di menu Persetujuan (desktop).
  const pendingApprovals =
    ctx.role === "owner"
      ? await prisma.productChangeRequest.count({ where: { businessId: ctx.business.id, status: "pending" } })
      : 0;

  return (
    <div className="flex min-h-dvh">
      <a
        href="#isi"
        className="sr-only z-[80] rounded-[var(--radius-sm)] bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Lewati ke isi
      </a>
      <Sidebar
        businessName={ctx.business.name}
        userName={ctx.user.name}
        role={ctx.role}
        pendingApprovals={pendingApprovals}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="isi"
          tabIndex={-1}
          className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 outline-none sm:px-8 sm:pb-14 sm:pt-10"
        >
          {children}
        </main>
      </div>
      <TabBar role={ctx.role} />
    </div>
  );
}
