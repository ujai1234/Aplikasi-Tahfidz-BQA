"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { NAV_GROUPS } from "@/lib/nav";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (user?.role === "Kepsek" && item.href === "/evaluasi") return false;
      if (!item.adminOnly) return true;
      return user?.role === "Admin";
    }),
  })).filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    toast.info("Anda telah keluar dari sistem. Barakallah!");
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-1 pb-4">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
          <Image
            src="/logobqa.jpg"
            alt="Logo BQA"
            width={48}
            height={48}
            className="size-full object-contain"
            priority
          />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[13.5px] font-bold text-white">
            Aplikasi Tahfidz
          </p>
          <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-white/65">
            Pondok Pesantren Baitul Qur&apos;an Al-Ikhwan
          </p>
        </div>
      </div>

      <nav
        aria-label="Navigasi utama"
        className="flex-1 space-y-0.5 overflow-y-auto py-3.5"
      >
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 mt-3.5 px-2.5 text-[10.5px] font-bold tracking-[0.14em] text-white/65 uppercase">
              {group.title}
            </p>
            {group.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-white/15 text-white shadow-sm before:absolute before:-left-5 before:top-1/2 before:h-5.5 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-gold before:content-['']"
                      : "text-white/90 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="size-[19px] shrink-0" strokeWidth={1.9} />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[11px] font-extrabold text-[#3c2c07]">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="grid gap-2.5 border-t border-white/10 pt-4">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed font-medium text-white/70">
          Sesi presensi · Subuh 04:30–06:00 · Maghrib 18:00–20:00 WIB
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:border-danger/40 hover:bg-danger/20 hover:text-[#ffb4b4]"
        >
          <LogOut className="size-4" strokeWidth={2} />
          Log Keluar
        </button>
      </div>
    </div>
  );
}
