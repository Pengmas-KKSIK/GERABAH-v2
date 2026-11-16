"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconPlus, IconArrowDown, IconArrowUp, IconReceipt, IconClipboard, IconLogout } from "./icons";
import { TAB_ITEMS, groupsFor, isActive, type NavItem, type Role } from "./nav-items";
import { Sheet } from "./dialog";
import { logout } from "@/lib/actions/auth";
import { Logo } from "./logo";

const RECORD_ACTIONS = [
  { href: "/finance/new?type=INCOME", label: "Uang Masuk", desc: "Uang yang diterima usaha", icon: IconArrowDown, tone: "in", ownerOnly: true },
  { href: "/finance/new?type=EXPENSE", label: "Uang Keluar", desc: "Uang yang dikeluarkan usaha", icon: IconArrowUp, tone: "out", ownerOnly: false },
  { href: "/sales/new", label: "Penjualan", desc: "Barang terjual, stok berkurang", icon: IconReceipt, tone: "neutral", ownerOnly: false },
  { href: "/orders/new", label: "Pesanan", desc: "Dibuat dulu, dibayar nanti", icon: IconClipboard, tone: "neutral", ownerOnly: false },
] as const;

const TONE = {
  in: "bg-teal-soft text-teal",
  out: "bg-clay-soft text-clay-ink",
  neutral: "bg-clay-soft text-clay-ink",
} as const;

function RecordSheet({ onClose, role }: { onClose: () => void; role: Role }) {
  const actions = role === "staff" ? RECORD_ACTIONS.filter((a) => !a.ownerOnly) : RECORD_ACTIONS;
  return (
    <Sheet title="Mau catat apa?" onClose={onClose}>
      <ul className="flex flex-col">
        {actions.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              onClick={onClose}
              className="-mx-2 flex min-h-[68px] items-center gap-3.5 rounded-[var(--radius-md)] px-2 transition-colors hover:bg-canvas active:bg-surface-2"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${TONE[a.tone]}`}>
                <a.icon className="h-6 w-6" strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold text-ink">{a.label}</span>
                <span className="block text-[15px] text-ink-2">{a.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function TabBar({ role = "owner" }: { role?: Role }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  return (
    <>
      {sheet && <RecordSheet onClose={() => setSheet(false)} role={role} />}
      <nav
        aria-label="Menu utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md sm:hidden"
      >
        <div className="mx-auto grid h-tabbar max-w-md grid-cols-5 items-start px-1.5 pt-2">
          {TAB_ITEMS.slice(0, 2).map((it) => (
            <TabLink key={it.href} it={it} active={isActive(pathname, it.href)} />
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-haspopup="dialog"
              className="flex min-h-[56px] flex-col items-center gap-1 text-[13px] font-bold text-ink"
            >
              <span className="flex h-11 w-14 items-center justify-center rounded-[16px] bg-clay text-white transition-colors active:bg-clay-ink">
                <IconPlus className="h-[26px] w-[26px]" strokeWidth={2.2} />
              </span>
              Catat
            </button>
          </div>
          {TAB_ITEMS.slice(2).map((it) => (
            <TabLink key={it.href} it={it} active={isActive(pathname, it.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function TabLink({ it, active }: { it: NavItem; active: boolean }) {
  return (
    <Link
      href={it.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[56px] flex-col items-center gap-1 text-[13px] transition-colors ${
        active ? "font-bold text-clay-ink" : "font-semibold text-ink-2"
      }`}
    >
      <span
        className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? "bg-clay-soft" : ""}`}
      >
        <it.icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      {it.label}
    </Link>
  );
}

export function Sidebar({
  businessName,
  userName,
  role = "owner",
  pendingApprovals = 0,
}: {
  businessName: string;
  userName: string;
  role?: Role;
  pendingApprovals?: number;
}) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-3 pb-4 pt-6 sm:flex">
      {sheet && <RecordSheet onClose={() => setSheet(false)} role={role} />}
      <Link href="/dashboard" aria-label="Gerabara, ke Beranda" className="mb-4 flex px-3">
        <Logo size={34} />
      </Link>
      <p className="mb-4 truncate px-3 text-[15px] font-semibold text-ink-2">{businessName}</p>

      <button
        type="button"
        onClick={() => setSheet(true)}
        aria-haspopup="dialog"
        className="btn btn-primary btn-sm mx-1 mb-6"
      >
        <IconPlus className="h-4 w-4" strokeWidth={2.5} />
        Catat
      </button>

      <nav aria-label="Menu utama" className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto">
        {groupsFor(role).map((g) => (
          <div key={g.title}>
            <p className="mb-1 px-3 text-[14px] font-bold text-ink-2">{g.title}</p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const active = isActive(pathname, it.href);
                const count = it.href === "/approvals" ? pendingApprovals : 0;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[44px] items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[16px] font-semibold transition-colors ${
                        active ? "bg-clay-soft font-bold text-clay-ink" : "text-ink-2 hover:bg-canvas hover:text-ink"
                      }`}
                    >
                      <it.icon
                        className="h-[19px] w-[19px]"
                        strokeWidth={active ? 2.1 : 1.8}
                      />
                      <span className="flex-1">{it.label}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-warn-soft px-2 text-[13px] font-bold leading-5 text-warn">
                          {count}
                          <span className="sr-only"> menunggu</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-3 flex items-center gap-2 border-t border-line px-2 pt-3">
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-[14px] font-semibold text-ink">{userName}</p>
          <p className="text-[14px] text-ink-3">{role === "staff" ? "Staf" : "Pemilik"}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="icon-btn" aria-label="Keluar dari akun" title="Keluar">
            <IconLogout className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </form>
      </div>
    </aside>
  );
}
