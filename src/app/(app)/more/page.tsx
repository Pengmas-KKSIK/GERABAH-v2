import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { List, Row, Avatar, Badge, Tile } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { LogoutButton } from "@/components/logout-button";
import { groupsFor } from "@/components/nav-items";
import { Logo } from "@/components/logo";

export default async function MorePage() {
  const ctx = await getSessionContext();
  const user = ctx?.user ?? null;
  const business = ctx?.business ?? null;
  const role = ctx?.role ?? "owner";
  const pendingApprovals =
    role === "owner" && business
      ? await prisma.productChangeRequest.count({ where: { businessId: business.id, status: "pending" } })
      : 0;

  // Beranda, Keuangan, dan Pesanan sudah ada di menu bawah — tidak perlu diulang di sini.
  const inTabBar = new Set(["/dashboard", "/finance", "/orders"]);
  const groups = groupsFor(role)
    .map((g) => ({ ...g, items: g.items.filter((it) => !inTabBar.has(it.href)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader title="Menu" />

      <div className="card mb-6 flex items-center gap-3.5 p-4">
        <Avatar name={user?.name ?? business?.name ?? "?"} className="!h-[52px] !w-[52px] !text-[20px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-bold text-ink">{user?.name}</p>
          <p className="truncate text-[15px] text-ink-2">
            {business?.name} · {role === "staff" ? "Staf" : "Pemilik"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 px-1 text-[15px] font-bold text-ink-2">{g.title}</h2>
            <List>
              {g.items.map((l) => (
                <Row
                  key={l.href}
                  href={l.href}
                  leading={
                    <Tile tone={l.tone ?? "stone"}>
                      <l.icon className="h-6 w-6" strokeWidth={1.75} />
                    </Tile>
                  }
                  title={l.label}
                  trailing={
                    l.href === "/approvals" && pendingApprovals > 0 ? (
                      <Badge tone="warn">{pendingApprovals} menunggu</Badge>
                    ) : undefined
                  }
                />
              ))}
            </List>
          </section>
        ))}
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <Logo size={32} />
        <p className="text-center text-[14px] text-ink-3">Program Pengabdian Masyarakat PPMI KKSIK ITB</p>
      </div>
    </>
  );
}
