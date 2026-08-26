import type { Metadata } from "next";
import { Amiri, Inter, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aplikasi Tahfidz · Pondok Pesantren Baitul Qur'an Al-Ikhwan",
    template: "%s · BQA Al-Ikhwan",
  },
  description:
    "Aplikasi Tahfidz Pondok Pesantren Baitul Qur'an Al-Ikhwan: manajemen hafalan santri dan absensi ustadz berbasis GPS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${sora.variable} ${amiri.variable} antialiased`}
    >
      <body className="min-h-screen">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
