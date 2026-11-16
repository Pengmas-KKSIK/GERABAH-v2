import {
  IconHome,
  IconWallet,
  IconBox,
  IconReceipt,
  IconClipboard,
  IconUsers,
  IconChart,
  IconSettings,
  IconCalculator,
  IconHelp,
  IconClock,
  IconLayers,
  IconClipboardCheck,
  IconMenu,
  IconHourglass,
} from "./icons";

export type Role = "owner" | "staff";
export type NavItem = {
  href: string;
  label: string;
  icon: typeof IconHome;
  ownerOnly?: boolean;
  /** Warna ubin ikon di halaman Menu: tanah liat = jualan, teal = uang, oker = barang, daun = orang. */
  tone?: "clay" | "teal" | "ochre" | "leaf" | "stone";
};
export type NavGroup = { title: string; items: NavItem[] };

/**
 * Satu-satunya daftar menu. Sidebar (desktop) dan halaman "Lainnya" (HP) sama-sama membaca dari sini,
 * jadi menambah menu cukup di satu tempat.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Harian",
    items: [
      { href: "/dashboard", label: "Beranda", icon: IconHome, tone: "stone" },
      { href: "/finance", label: "Keuangan", icon: IconWallet, tone: "teal" },
      { href: "/sales", label: "Penjualan", icon: IconReceipt, tone: "clay" },
      { href: "/orders", label: "Pesanan", icon: IconClipboard, tone: "clay" },
      { href: "/receivables", label: "Belum Lunas", icon: IconHourglass, tone: "teal" },
    ],
  },
  {
    title: "Data Usaha",
    items: [
      { href: "/products", label: "Produk", icon: IconBox, tone: "ochre" },
      { href: "/customers", label: "Pelanggan", icon: IconUsers, tone: "leaf" },
      { href: "/workshop", label: "Workshop", icon: IconCalculator, tone: "leaf" },
      { href: "/assets", label: "Aset & Biaya Tetap", icon: IconLayers, ownerOnly: true, tone: "ochre" },
    ],
  },
  {
    title: "Pemilik",
    items: [
      { href: "/reports", label: "Laporan", icon: IconChart, ownerOnly: true, tone: "teal" },
      { href: "/approvals", label: "Persetujuan", icon: IconClipboardCheck, ownerOnly: true, tone: "stone" },
      { href: "/activity", label: "Log Aktivitas", icon: IconClock, ownerOnly: true, tone: "stone" },
      { href: "/settings", label: "Pengaturan", icon: IconSettings, ownerOnly: true, tone: "stone" },
    ],
  },
  {
    title: "Lainnya",
    items: [{ href: "/help", label: "Bantuan", icon: IconHelp, tone: "stone" }],
  },
];

/** Menu bawah di HP (tombol + ada di tengah). */
export const TAB_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: IconHome, tone: "stone" },
  { href: "/finance", label: "Keuangan", icon: IconWallet, tone: "teal" },
  { href: "/orders", label: "Pesanan", icon: IconClipboard, tone: "clay" },
  { href: "/more", label: "Menu", icon: IconMenu, tone: "stone" },
];

export function groupsFor(role: Role): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: role === "owner" ? g.items : g.items.filter((it) => !it.ownerOnly),
  })).filter((g) => g.items.length > 0);
}

export function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}
