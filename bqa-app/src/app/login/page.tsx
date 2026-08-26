import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f7f4] p-6">
      <div className="w-full max-w-[400px]">
        <div className="animate-fade-up rounded-2xl border border-line bg-card p-8 shadow-pop">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid size-20 place-items-center overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-soft">
              <Image
                src="/logobqa.jpg"
                alt="Logo Pondok Pesantren Baitul Qur'an Al-Ikhwan"
                width={80}
                height={80}
                className="size-full object-contain"
                priority
              />
            </span>
            <div className="space-y-1">
              <h1 className="font-display text-[19px] font-extrabold tracking-tight text-ink">
                Aplikasi Tahfidz
              </h1>
              <p className="text-[13px] font-semibold text-muted-foreground">
                Pondok Pesantren Baitul Qur&apos;an Al-Ikhwan
              </p>
              <p className="font-arabic text-[15px] leading-relaxed text-primary">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          </div>

          <div className="mt-6">
            <LoginForm />
          </div>

          <p className="mt-5 border-t border-line pt-4 text-center text-[11.5px] font-medium text-muted-foreground">
            Sesi diamankan JWT 24 jam · © 2026 BQA Al-Ikhwan
          </p>
        </div>
      </div>
    </main>
  );
}
