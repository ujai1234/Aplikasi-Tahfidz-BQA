import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";

export const metadata: Metadata = { title: "Masuk · Aplikasi Tahfidz BQA" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-canvas p-4 sm:p-6 transition-colors duration-300 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-up z-10 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 relative group">
            <BrandLogo size="lg" className="transition-transform duration-300 hover:scale-105 filter drop-shadow-xl" />
          </div>
          <p className="font-arabic text-emerald-800 dark:text-emerald-300 text-lg font-bold tracking-wide mb-1">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="text-2xl font-display font-extrabold text-ink tracking-tight">
            Aplikasi Tahfidz &amp; Presensi
          </h1>
          <p className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 inline-block px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            Baitul Qur&apos;an Al-Ikhwan
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card/95 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-card rounded-3xl border border-line border-t-4 border-t-[#d97706] border-l-4 border-l-[#d97706]">
          <LoginForm />

          <p className="mt-6 border-t border-line pt-4 text-center text-[11.5px] font-medium text-muted-foreground">
            Sesi diamankan JWT 5 menit · © 2026 Pondok Pesantren Baitul Qur&apos;an Al-Ikhwan
          </p>
        </div>
      </div>
    </main>
  );
}
