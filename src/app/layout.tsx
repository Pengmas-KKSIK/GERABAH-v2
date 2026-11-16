import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Urbanist } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/toaster";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Huruf tulisan logo "gerabara". Hanya dipakai lewat kelas `font-brand` (lihat components/logo.tsx).
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Catat uang masuk dan keluar usaha gerabah, lihat untung rugi, dan cetak invoice PDF langsung dari HP.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f1e8",
  width: "device-width",
  initialScale: 1,
  // Zoom sengaja TIDAK dikunci (WCAG 1.4.4). Isian sudah 16px, jadi iOS tidak zoom otomatis saat fokus.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${urbanist.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
